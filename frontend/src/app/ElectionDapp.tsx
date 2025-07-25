"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, Crown, Eye, Lock, Users, Trophy, Settings, Vote } from "lucide-react";
import { toast } from "sonner";
import './basic.css';
import ElectionArtifact from './ElectionABI.json';
const abi = ElectionArtifact.abi;

// You'll need to create this JSON file with your contract ABI
// const ElectionArtifact = { abi: [] }; // Replace with actual ABI
// const abi = ElectionArtifact.abi;

declare global {
  interface Window {
    ethereum?: any;
  }
}

const CONTRACT_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

const NAV_TABS = [
  { key: "register", label: "Register Voter", icon: Users },
  { key: "nominate", label: "Nominate", icon: Crown },
  { key: "commit", label: "Commit Vote", icon: Lock },
  { key: "reveal", label: "Reveal Vote", icon: Eye },
  { key: "count", label: "Vote Count", icon: Vote },
  { key: "top10", label: "Elected Committees", icon: Trophy },
  { key: "phase", label: "Phase Control", icon: Settings },
];

export default function ElectionDapp() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState<string>("");
  const [owner, setOwner] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isVoter, setIsVoter] = useState<boolean>(false);

  // Navigation
  const [activeTab, setActiveTab] = useState<string>("top10");

  // Feature states
  const [registerAddress, setRegisterAddress] = useState<string>("");
  const [nomineeName, setNomineeName] = useState<string>("");
  const [commitCandidate, setCommitCandidate] = useState<string>("");
  const [commitSecret, setCommitSecret] = useState<string>("");
  const [revealCandidate, setRevealCandidate] = useState<string>("");
  const [revealSecret, setRevealSecret] = useState<string>("");
  const [voteCountAddress, setVoteCountAddress] = useState<string>("");
  const [voteCount, setVoteCount] = useState<number | null>(null);
  const [top10, setTop10] = useState<string[]>([]);

  // Connect to MetaMask
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const signer = await browserProvider.getSigner();
        setProvider(browserProvider);
        setSigner(signer);
        const acc = await signer.getAddress();
        setAccount(acc);
        
        // Note: You'll need to uncomment this when you have the actual ABI
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
        setContract(contract);
        
        toast.success("Wallet connected successfully!");

        // Fetch owner and check admin (uncomment when contract is ready)
        const ownerAddr = await contract.owner();
        setOwner(ownerAddr);
        setIsAdmin(acc.toLowerCase() === ownerAddr.toLowerCase());

        // Check if registered voter (uncomment when contract is ready)
        try {
          const voter = await contract.voters(acc);
          setIsVoter(voter.registered);
        } catch {
          setIsVoter(false);
        }
      } catch (error: any) {
        toast.error("Failed to connect wallet: " + error.message);
      }
    } else {
      toast.error("Please install MetaMask to use this application.");
    }
  };

  // Fetch elected committees
  const fetchTop10 = async () => {
    if (!contract) return;
    try {
      const top10Addresses = await contract.getTop10();
      setTop10(top10Addresses);
    } catch (err: any) {
      toast.error("Error fetching top 10: " + (err.reason || err.message));
    }
  };

  // Register voter (admin only)
  const registerVoter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !signer) return;
    try {
      const tx = await contract.registerVoter(registerAddress);
      await tx.wait();
      toast.success("Voter registered successfully!");
      setRegisterAddress("");
    } catch (err: any) {
      toast.error("Error registering voter: " + (err.reason || err.message));
    }
  };

  // Nominate as candidate
  const nominate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !signer) return;
    try {
      const tx = await contract.nominate(nomineeName, {
        value: ethers.parseEther("0.1"),
      });
      await tx.wait();
      toast.success("Nomination successful!");
      setNomineeName("");
    } catch (err: any) {
      toast.error("Error nominating: " + (err.reason || err.message));
    }
  };

  // Commit vote
  const commitVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !signer) return;
    try {
      const voteHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["address", "string"],
          [commitCandidate, commitSecret]
        )
      );
      const tx = await contract.commitVote(voteHash);
      await tx.wait();
      toast.success("Vote committed successfully!");
      setCommitCandidate("");
      setCommitSecret("");
    } catch (err: any) {
      toast.error("Error committing vote: " + (err.reason || err.message));
    }
  };

  // Reveal vote
  const revealVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !signer) return;
    try {
      const tx = await contract.revealVote(revealCandidate, revealSecret);
      await tx.wait();
      toast.success("Vote revealed successfully!");
      setRevealCandidate("");
      setRevealSecret("");
    } catch (err: any) {
      toast.error("Error revealing vote: " + (err.reason || err.message));
    }
  };

  // Get vote count
  const fetchVoteCount = async () => {
    if (!contract) return;
    try {
      const count = await contract.getVoteCount(voteCountAddress);
      setVoteCount(Number(count));
      toast.success("Vote count retrieved!");
    } catch (err: any) {
      toast.error("Error fetching vote count: " + (err.reason || err.message));
    }
  };

  // Phase control (admin only)
  const nextPhase = async () => {
    if (!contract) return;
    try {
      const tx = await contract.nextPhase();
      await tx.wait();
      toast.success("Phase advanced successfully!");
    } catch (err: any) {
      toast.error("Error advancing phase: " + (err.reason || err.message));
    }
  };

  const publishResults = async () => {
    if (!contract) return;
    try {
      const tx = await contract.publishResults();
      await tx.wait();
      toast.success("Results published successfully!");
      fetchTop10();
    } catch (err: any) {
      toast.error("Error publishing results: " + (err.reason || err.message));
    }
  };

  useEffect(() => {
    if (contract) fetchTop10();
  }, [contract]);

  // Navigation bar
  const navTabs = isAdmin
    ? NAV_TABS
    : isVoter
      ? NAV_TABS.filter(tab =>
          ["nominate", "commit", "reveal", "top10", "count"].includes(tab.key)
        )
      : NAV_TABS.filter(tab => ["top10", "count"].includes(tab.key));

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-background via-muted/50 to-primary/5">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <Card className="card-3d mb-8 overflow-hidden">
          <div className="relative">
            <img 
              src="/assets/voting.png" 
              alt="Your Vote Matters" 
              className="w-full h-32 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-secondary/80 flex items-center justify-center">
              <div className="text-center floating">
                <h1 className="text-4xl font-bold text-white mb-2">
                  Decentralized Election DApp
                </h1>
                <p className="text-white/90 text-lg">
                  Secure • Transparent • Democratic
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Connection Status */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            {account && (
              <Badge variant="secondary" className="glass-panel px-4 py-2">
                <Wallet className="w-4 h-4 mr-2" />
                {account.slice(0, 6)}...{account.slice(-4)}
              </Badge>
            )}
            {isAdmin && (
              <Badge variant="destructive" className="px-4 py-2">
                <Crown className="w-4 h-4 mr-2" />
                Admin
              </Badge>
            )}
            {isVoter && !isAdmin && (
              <Badge variant="outline" className="px-4 py-2">
                <Vote className="w-4 h-4 mr-2" />
                Registered Voter
              </Badge>
            )}
          </div>
          
          <Button 
            onClick={connectWallet} 
            className="btn-3d text-white font-semibold px-6"
            disabled={!!account}
          >
            <Wallet className="w-4 h-4 mr-2" />
            {account ? "Connected" : "Connect Wallet"}
          </Button>
        </div>

        {/* Navigation Tabs */}
        <Card className="card-3d mb-6">
          <CardContent className="p-2">
            <nav className="flex gap-1 overflow-x-auto">
              {navTabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`tab-3d flex-1 min-w-max px-4 py-3 rounded-lg transition-all ${
                      activeTab === tab.key 
                        ? 'active bg-primary/10 text-primary' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Icon className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Feature Panels */}
        <Card className="card-3d">
          <CardContent className="p-6">
            {activeTab === "register" && isAdmin && (
              <div>
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Users className="w-5 h-5" />
                    Register Voter
                  </CardTitle>
                </CardHeader>
                <form onSubmit={registerVoter} className="space-y-4">
                  <div className="flex gap-3">
                    <Input
                      type="text"
                      placeholder="Enter voter address (0x...)"
                      value={registerAddress}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegisterAddress(e.target.value)}
                      className="input-3d flex-1"
                      required
                    />
                    <Button type="submit" className="btn-3d text-white">
                      Register
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "nominate" && (isAdmin || isVoter) && (
              <div>
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Crown className="w-5 h-5" />
                    Nominate as Candidate
                  </CardTitle>
                </CardHeader>
                <form onSubmit={nominate} className="space-y-4">
                  <div className="flex gap-3">
                    <Input
                      type="text"
                      placeholder="Enter your full name"
                      value={nomineeName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNomineeName(e.target.value)}
                      className="input-3d flex-1"
                      required
                    />
                    <Button type="submit" className="btn-3d text-white">
                      Nominate (0.1 ETH)
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    💰 A deposit of 0.1 ETH is required for nomination
                  </p>
                </form>
              </div>
            )}

            {activeTab === "commit" && (isAdmin || isVoter) && (
              <div>
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Lock className="w-5 h-5" />
                    Commit Vote
                  </CardTitle>
                </CardHeader>
                <form onSubmit={commitVote} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      type="text"
                      placeholder="Candidate address (0x...)"
                      value={commitCandidate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCommitCandidate(e.target.value)}
                      className="input-3d"
                      required
                    />
                    <Input
                      type="password"
                      placeholder="Your secret phrase"
                      value={commitSecret}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCommitSecret(e.target.value)}
                      className="input-3d"
                      required
                    />
                  </div>
                  <Button type="submit" className="btn-3d text-white w-full">
                    <Lock className="w-4 h-4 mr-2" />
                    Commit Vote
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    🔒 Your vote will be encrypted and hidden until the reveal phase
                  </p>
                </form>
              </div>
            )}

            {activeTab === "reveal" && (isAdmin || isVoter) && (
              <div>
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Eye className="w-5 h-5" />
                    Reveal Vote
                  </CardTitle>
                </CardHeader>
                <form onSubmit={revealVote} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      type="text"
                      placeholder="Candidate address (0x...)"
                      value={revealCandidate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRevealCandidate(e.target.value)}
                      className="input-3d"
                      required
                    />
                    <Input
                      type="password"
                      placeholder="Your secret phrase"
                      value={revealSecret}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRevealSecret(e.target.value)}
                      className="input-3d"
                      required
                    />
                  </div>
                  <Button type="submit" className="btn-3d text-white w-full">
                    <Eye className="w-4 h-4 mr-2" />
                    Reveal Vote
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    👁️ Use the same candidate and secret from your commit phase
                  </p>
                </form>
              </div>
            )}

            {activeTab === "count" && (
              <div>
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Vote className="w-5 h-5" />
                    Get Vote Count
                  </CardTitle>
                </CardHeader>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Input
                      type="text"
                      placeholder="Candidate address (0x...)"
                      value={voteCountAddress}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVoteCountAddress(e.target.value)}
                      className="input-3d flex-1"
                    />
                    <Button onClick={fetchVoteCount} className="btn-3d text-white">
                      Get Count
                    </Button>
                  </div>
                  {voteCount !== null && (
                    <div className="glass-panel p-4 rounded-lg">
                      <p className="text-lg font-semibold text-primary">
                        📊 Vote Count: {voteCount}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "top10" && (
              <div>
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Trophy className="w-5 h-5" />
                    Elected Committees
                  </CardTitle>
                </CardHeader>
                <div className="space-y-3">
                  {top10.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No results available yet</p>
                      <p className="text-sm">Results will appear after voting concludes</p>
                    </div>
                  ) : (
                    top10.map((addr, idx) => (
                      <div key={addr} className="glass-panel p-4 rounded-lg flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          idx === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                          idx === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                          idx === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-800' :
                          'bg-gradient-to-r from-primary to-primary-glow'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-mono text-sm">{addr}</p>
                        </div>
                        {idx < 3 && (
                          <Trophy className={`w-5 h-5 ${
                            idx === 0 ? 'text-yellow-500' :
                            idx === 1 ? 'text-gray-500' :
                            'text-amber-600'
                          }`} />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "phase" && isAdmin && (
              <div>
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Settings className="w-5 h-5" />
                    Phase Control (Admin Only)
                  </CardTitle>
                </CardHeader>
                <div className="flex gap-3">
                  <Button onClick={nextPhase} className="btn-secondary text-white flex-1">
                    <Settings className="w-4 h-4 mr-2" />
                    Advance Phase
                  </Button>
                  <Button onClick={publishResults} className="btn-secondary text-white flex-1">
                    <Trophy className="w-4 h-4 mr-2" />
                    Publish Results
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  ⚙️ Use these controls to manage the election phases and publish final results
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-muted-foreground">
          <p className="text-sm">
            🔐 Powered by Ethereum Blockchain • Built for Transparency
          </p>
        </div>
      </div>
    </div>
  );
}