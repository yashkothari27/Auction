import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    CircularProgress,
    Typography,
    Box,
    Alert
} from '@mui/material';
import { toast } from 'react-toastify';

function PlaceBid({ contract, auctionId, auctionOwner }) {
    const [bidAmount, setBidAmount] = useState('');
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [balance, setBalance] = useState(null);
    const [currentAccount, setCurrentAccount] = useState(null);

    useEffect(() => {
        const getAccount = async () => {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const account = await signer.getAddress();
            setCurrentAccount(account);
        };
        getAccount();
    }, []);

    const handleOpen = async () => {
        try {
            if (currentAccount && currentAccount.toLowerCase() === auctionOwner.toLowerCase()) {
                toast.error("You cannot bid on your own auction");
                return;
            }

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const balance = await provider.getBalance(await provider.getSigner().getAddress());
            setBalance(ethers.utils.formatEther(balance));
            setOpen(true);
        } catch (error) {
            console.error('Error getting balance:', error);
            toast.error('Failed to get wallet balance');
        }
    };

    const handleClose = () => {
        setOpen(false);
        setBidAmount('');
    };

    const handleBid = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (currentAccount.toLowerCase() === auctionOwner.toLowerCase()) {
                throw new Error("You cannot bid on your own auction");
            }

            const bidAmountWei = ethers.utils.parseEther(bidAmount);
            
            if (bidAmountWei.gt(ethers.utils.parseEther(balance))) {
                throw new Error(`Insufficient balance. You have ${balance} RTC available`);
            }

            const tx = await contract.placeBid(auctionId, {
                value: bidAmountWei,
                gasLimit: 200000
            });
            toast.info('Placing bid... Please wait');
            await tx.wait();
            toast.success('Bid placed successfully!');
            handleClose();
        } catch (error) {
            console.error('Error placing bid:', error);
            if (error.data?.message?.includes('cost exceeds account balance')) {
                toast.error(`Insufficient balance. You have ${balance} RTC available`);
            } else if (error.message?.includes('Owner cannot bid')) {
                toast.error('You cannot bid on your own auction');
            } else {
                toast.error(error.message || 'Failed to place bid');
            }
        } finally {
            setLoading(false);
        }
    };

    if (currentAccount && currentAccount.toLowerCase() === auctionOwner.toLowerCase()) {
        return (
            <Alert severity="info" sx={{ mt: 1 }}>
                This is your auction
            </Alert>
        );
    }

    return (
        <>
            <Button variant="contained" color="primary" onClick={handleOpen} fullWidth>
                Place Bid
            </Button>
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>Place a Bid</DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                            Your balance: {balance} RTC
                        </Typography>
                    </Box>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Bid Amount (RTC)"
                        type="number"
                        fullWidth
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        inputProps={{ 
                            step: "0.01",
                            min: "0",
                            max: balance
                        }}
                        disabled={loading}
                        error={bidAmount > balance}
                        helperText={bidAmount > balance ? "Bid amount exceeds your balance" : ""}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleBid} 
                        variant="contained" 
                        color="primary"
                        disabled={loading || !bidAmount || bidAmount > balance}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Place Bid'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default PlaceBid; 