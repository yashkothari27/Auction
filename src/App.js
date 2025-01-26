import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
    AppBar, 
    Toolbar, 
    Typography, 
    Container, 
    Box, 
    CircularProgress,
    Paper,
    Tabs,
    Tab,
    ThemeProvider,
    createTheme,
    CssBaseline,
    Button,
    Stack
} from '@mui/material';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { alpha } from '@mui/material/styles';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LogoutIcon from '@mui/icons-material/Logout';

import CreateAuction from './components/CreateAuction';
import AuctionList from './components/AuctionList';
import AuctionSystemABI from './contracts/AuctionSystem.json';

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#6366f1',
            light: '#818cf8',
            dark: '#4f46e5',
        },
        secondary: {
            main: '#ec4899',
            light: '#f472b6',
            dark: '#db2777',
        },
        background: {
            default: '#0f172a',
            paper: '#1e293b',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
            fontWeight: 700,
        },
        h6: {
            fontWeight: 600,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                    fontWeight: 600,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    },
                },
                contained: {
                    backgroundImage: 'linear-gradient(to right, #6366f1, #818cf8)',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    backdropFilter: 'blur(10px)',
                    backgroundColor: alpha('#1e293b', 0.8),
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                    },
                },
            },
        },
    },
});

function App() {
    const [account, setAccount] = useState(null);
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [balance, setBalance] = useState(null);

    useEffect(() => {
        const init = async () => {
            if (window.ethereum) {
                try {
                    // Request account access
                    const accounts = await window.ethereum.request({
                        method: 'eth_requestAccounts'
                    });
                    setAccount(accounts[0]);

                    // Get balance
                    const provider = new ethers.providers.Web3Provider(window.ethereum);
                    const balance = await provider.getBalance(accounts[0]);
                    setBalance(ethers.utils.formatEther(balance));

                    // Switch network
                    await switchToRTCNetwork();
                    
                    // Initialize contract
                    await initializeContract();

                } catch (error) {
                    console.error('Error connecting wallet:', error);
                    toast.error(error.message || 'Failed to connect wallet');
                }
            } else {
                toast.error('Please install MetaMask!');
            }
            setLoading(false);
        };

        init();

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', () => {});
            }
        };
    }, []);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                // Request account access
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });
                setAccount(accounts[0]);

                // Get balance
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const balance = await provider.getBalance(accounts[0]);
                setBalance(ethers.utils.formatEther(balance));

                // Switch network
                await switchToRTCNetwork();
                
                // Initialize contract
                await initializeContract();

            } catch (error) {
                console.error('Error connecting wallet:', error);
                toast.error(error.message || 'Failed to connect wallet');
            }
        } else {
            toast.error('Please install MetaMask!');
        }
    };

    const disconnectWallet = () => {
        setAccount(null);
        setContract(null);
        setBalance(null);
        toast.success('Wallet disconnected');
    };

    const switchToRTCNetwork = async () => {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x7e43' }], // 32323 in hex
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0x7e43',
                        chainName: 'RTC Mainnet',
                        nativeCurrency: {
                            name: 'RTC',
                            symbol: 'RTC',
                            decimals: 18
                        },
                        rpcUrls: ['https://mainnet.reltime.com'],
                        blockExplorerUrls: ['https://explorer.reltime.com']
                    }]
                });
            }
        }
    };

    const initializeContract = async () => {
        try {
            const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
            if (!contractAddress) {
                throw new Error('Contract address not set in environment variables');
            }

            // Add error handling for provider
            if (!window.ethereum) {
                throw new Error('MetaMask is not installed');
            }

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            
            // Add error handling for contract initialization
            const auctionContract = new ethers.Contract(
                contractAddress,
                AuctionSystemABI.abi,
                signer
            );

            if (!auctionContract) {
                throw new Error('Failed to initialize contract');
            }

            setContract(auctionContract);
        } catch (error) {
            console.error('Contract initialization error:', error);
            toast.error(error.message || 'Failed to initialize contract');
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ flexGrow: 1 }}>
                <AppBar position="static">
                    <Toolbar>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                            Auction DApp
                        </Typography>
                        {account ? (
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Typography variant="body2">
                                    Balance: {parseFloat(balance).toFixed(4)} RTC
                                </Typography>
                                <Typography variant="body2">
                                    {`${account.slice(0, 6)}...${account.slice(-4)}`}
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    startIcon={<LogoutIcon />}
                                    onClick={disconnectWallet}
                                    sx={{
                                        borderRadius: '20px',
                                        textTransform: 'none',
                                    }}
                                >
                                    Disconnect
                                </Button>
                            </Stack>
                        ) : (
                            <Button
                                variant="contained"
                                color="secondary"
                                startIcon={<AccountBalanceWalletIcon />}
                                onClick={connectWallet}
                                sx={{
                                    borderRadius: '20px',
                                    textTransform: 'none',
                                }}
                            >
                                Connect Wallet
                            </Button>
                        )}
                    </Toolbar>
                </AppBar>

                {/* Show content only if wallet is connected */}
                {account ? (
                    <Container maxWidth="lg" sx={{ mt: 4 }}>
                        <Paper sx={{ mb: 4 }}>
                            <Tabs
                                value={tabValue}
                                onChange={handleTabChange}
                                centered
                                sx={{ borderBottom: 1, borderColor: 'divider' }}
                            >
                                <Tab label="Create Auction" />
                                <Tab label="My Auctions" />
                                <Tab label="All Auctions" />
                            </Tabs>
                        </Paper>

                        {tabValue === 0 && (
                            <CreateAuction contract={contract} />
                        )}
                        {tabValue === 1 && (
                            <AuctionList contract={contract} account={account} ownerOnly={true} />
                        )}
                        {tabValue === 2 && (
                            <AuctionList contract={contract} account={account} ownerOnly={false} />
                        )}
                    </Container>
                ) : (
                    <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        minHeight="80vh"
                        textAlign="center"
                        px={3}
                    >
                        <Typography variant="h4" component="h1" gutterBottom>
                            Welcome to Auction DApp
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                            Connect your wallet to start creating and participating in auctions
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<AccountBalanceWalletIcon />}
                            onClick={connectWallet}
                            sx={{
                                borderRadius: '20px',
                                textTransform: 'none',
                                px: 4,
                                py: 1.5,
                            }}
                        >
                            Connect Wallet
                        </Button>
                    </Box>
                )}
            </Box>
            <ToastContainer position="bottom-right" />
        </ThemeProvider>
    );
}

export default App; 