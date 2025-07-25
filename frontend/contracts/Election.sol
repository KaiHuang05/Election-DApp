// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract Election {
    uint public constant DEPOSIT = 0.1 ether;
    uint public constant REFUND_THRESHOLD = 125; // 12.5% in tenths of percent (e.g., 12.5% = 125)
    uint public electionEnd;
    uint public revealEnd;
    address public owner;

    enum Phase { Nomination, CommitVote, RevealVote, Ended }
    Phase public currentPhase;

    struct Candidate {
        address candidateAddress;
        string name;
        uint voteCount;
        bool nominated;
        bool refunded;
    }

    struct Voter {
        bool registered;
        bytes32 voteHash; // Commitment hash
        bool voted;
        bool revealed;
    }

    address[] public candidateList;
    mapping(address => Candidate) public candidates;
    mapping(address => Voter) public voters;

    uint public totalVotes = 0;
    uint public totalVoters = 0;
    bool public resultsPublished = false;

    address[] public top10;

    constructor(uint _commitDuration, uint _revealDuration) {
        owner = msg.sender;
        currentPhase = Phase.Nomination;
        electionEnd = block.timestamp + _commitDuration;
        revealEnd = electionEnd + _revealDuration;
    }

    // -----------------------------------
    // 🔐 Only Owner Modifier
    modifier onlyOwner() {
        require(msg.sender == owner, "Only admin can do this");
        _;
    }

    // -----------------------------------
    // 🟩 Add voter (whitelist)
    function registerVoter(address voter) public onlyOwner {
        require(!voters[voter].registered, "Already registered");
        voters[voter].registered = true;
        totalVoters++;
    }

    // -----------------------------------
    // 🧾 Candidate nomination
    function nominate(string memory name) external payable {
        require(currentPhase == Phase.Nomination, "Not in nomination phase");
        require(!candidates[msg.sender].nominated, "Already nominated");
        require(msg.value == DEPOSIT, "Deposit of 0.1 ETH required");

        candidates[msg.sender] = Candidate({
            candidateAddress: msg.sender,
            name: name,
            voteCount: 0,
            nominated: true,
            refunded: false
        });

        candidateList.push(msg.sender);
    }

    // -----------------------------------
    // 🔐 Commit Vote (hash)
    function commitVote(bytes32 _voteHash) external {
        require(currentPhase == Phase.CommitVote, "Not commit phase");
        require(voters[msg.sender].registered, "Not registered");
        require(!voters[msg.sender].voted, "Already voted");

        voters[msg.sender].voteHash = _voteHash;
        voters[msg.sender].voted = true;
    }

    // -----------------------------------
    // 📤 Reveal Vote
    function revealVote(address candidate, string memory secret) external {
        require(currentPhase == Phase.RevealVote, "Not reveal phase");
        require(voters[msg.sender].voted, "Did not commit");
        require(!voters[msg.sender].revealed, "Already revealed");

        bytes32 expectedHash = keccak256(abi.encodePacked(candidate, secret));
        require(expectedHash == voters[msg.sender].voteHash, "Invalid reveal");

        require(candidates[candidate].nominated, "Invalid candidate");

        candidates[candidate].voteCount += 1;
        voters[msg.sender].revealed = true;
        totalVotes += 1;
    }

    // -----------------------------------
    // 🔄 Transition phases manually
    function nextPhase() public onlyOwner {
        if (currentPhase == Phase.Nomination) {
            currentPhase = Phase.CommitVote;
        } else if (currentPhase == Phase.CommitVote) {
            require(block.timestamp > electionEnd, "Commit phase not over");
            currentPhase = Phase.RevealVote;
        } else if (currentPhase == Phase.RevealVote) {
            require(block.timestamp > revealEnd, "Reveal phase not over");
            currentPhase = Phase.Ended;
        }
    }

    // -----------------------------------
    // 🏁 Publish Results
    function publishResults() external onlyOwner {
        require(currentPhase == Phase.Ended, "Election not ended");
        require(!resultsPublished, "Already published");

        // Sort top 10 candidates
        address[] memory temp = candidateList;
        for (uint i = 0; i < temp.length; i++) {
            for (uint j = i + 1; j < temp.length; j++) {
                if (candidates[temp[j]].voteCount > candidates[temp[i]].voteCount) {
                    address tmp = temp[i];
                    temp[i] = temp[j];
                    temp[j] = tmp;
                }
            }
        }

        uint limit = temp.length < 10 ? temp.length : 10;
        for (uint i = 0; i < limit; i++) {
            top10.push(temp[i]);
        }

        resultsPublished = true;
    }

    // -----------------------------------
    // 💸 Refund deposit to eligible candidates
    function claimRefund() external {
        require(currentPhase == Phase.Ended, "Election not ended");
        Candidate storage c = candidates[msg.sender];
        require(c.nominated, "Not a candidate");
        require(!c.refunded, "Already refunded");

        uint thresholdVotes = (totalVotes * REFUND_THRESHOLD) / 1000;
        require(c.voteCount >= thresholdVotes, "Not enough votes for refund");

        c.refunded = true;
        payable(msg.sender).transfer(DEPOSIT);
    }

    // -----------------------------------
    // 🔍 Get top 10 elected MPs
    function getTop10() public view returns (address[] memory) {
        require(resultsPublished, "Results not ready");
        return top10;
    }

    // -----------------------------------
    // 📊 Get vote count for a candidate
    function getVoteCount(address candidate) public view returns (uint) {
        return candidates[candidate].voteCount;
    }
}
