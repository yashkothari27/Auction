import React, { useState, useEffect, useCallback } from 'react';
import {
    Typography,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    Chip,
    CircularProgress,
    Box
} from '@mui/material';
import { toast } from 'react-toastify';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';
import PlaceBid from './PlaceBid';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { styled } from '@mui/material/styles';

// Styled components
const StyledCard = styled(motion.div)(({ theme }) => ({
  width: '100%',
  height: '100%',
}));

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

function AuctionCard({ auction, handleEndAuction, contract, account }) {
    const [ref, inView] = useInView({
        threshold: 0.1,
        triggerOnce: true
    });

    return (
        <Grid item xs={12} sm={6} md={4} ref={ref}>
            <StyledCard
                variants={item}
                animate={inView ? "show" : "hidden"}
            >
                <Card elevation={3}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            {auction.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" paragraph>
                            {auction.description}
                        </Typography>
                        <Box display="flex" gap={1} mb={2}>
                            <Chip
                                icon={auction.isActive ? <AccessTimeIcon /> : auction.isEnded ? <DoneIcon /> : <CloseIcon />}
                                label={auction.isActive ? 'Active' : auction.isEnded ? 'Ended' : 'Inactive'}
                                color={auction.isActive ? 'success' : 'default'}
                            />
                            <Chip label={`${auction.bidCount} bids`} variant="outlined" />
                        </Box>
                        <Typography variant="body2" color="textSecondary">
                            Start: {auction.startTime}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            End: {auction.endTime}
                        </Typography>
                    </CardContent>
                    <CardActions sx={{ p: 2, gap: 1 }}>
                        {auction.isActive && !auction.isEnded && auction.owner === account && (
                            <Button 
                                variant="contained" 
                                color="secondary"
                                onClick={() => handleEndAuction(auction.id)}
                                fullWidth
                            >
                                End Auction
                            </Button>
                        )}
                        {auction.isActive && !auction.isEnded && (
                            <PlaceBid 
                                contract={contract} 
                                auctionId={auction.id} 
                                auctionOwner={auction.owner}
                            />
                        )}
                    </CardActions>
                </Card>
            </StyledCard>
        </Grid>
    );
}

function AuctionList({ contract, account, ownerOnly }) {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadAuctions = useCallback(async () => {
        try {
            let userAuctions;
            if (ownerOnly) {
                userAuctions = await contract.getUserAuctions(account);
            } else {
                // Try to get auction counter first
                const counter = await contract.auctionCounter();
                userAuctions = Array.from(
                    { length: counter.toNumber() },
                    (_, i) => i + 1
                );
            }
            
            const auctionDetails = await Promise.all(
                userAuctions.map(async (id) => {
                    try {
                        const auction = await contract.auctions(id);
                        const bids = await contract.getAuctionBids(id);
                        return {
                            id: auction.id.toString(),
                            title: auction.title,
                            description: auction.description,
                            isActive: auction.isActive,
                            isEnded: auction.isEnded,
                            owner: auction.owner,
                            startTime: new Date(auction.startTime * 1000).toLocaleString(),
                            endTime: new Date(auction.endTime * 1000).toLocaleString(),
                            bidCount: bids.length
                        };
                    } catch (error) {
                        console.error(`Error loading auction ${id}:`, error);
                        return null;
                    }
                })
            );

            // Filter out any null values from failed auction loads
            setAuctions(auctionDetails.filter(auction => auction !== null));
            setError(null);
        } catch (error) {
            console.error('Error loading auctions:', error);
            setError('Failed to load auctions. Please make sure you are connected to the correct network.');
            toast.error('Failed to load auctions');
        } finally {
            setLoading(false);
        }
    }, [contract, account, ownerOnly]);

    useEffect(() => {
        if (contract && account) {
            loadAuctions();
        }
    }, [contract, account, loadAuctions]);

    const handleEndAuction = async (auctionId) => {
        try {
            const tx = await contract.endAuction(auctionId);
            toast.info('Ending auction... Please wait');
            await tx.wait();
            toast.success('Auction ended successfully');
            loadAuctions();
        } catch (error) {
            console.error('Error ending auction:', error);
            toast.error(error.message || 'Failed to end auction');
        }
    };

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography color="error" gutterBottom>
                    {error}
                </Typography>
                <Button 
                    variant="contained" 
                    onClick={() => {
                        setLoading(true);
                        setError(null);
                        loadAuctions();
                    }}
                >
                    Retry
                </Button>
            </Box>
        );
    }

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <div>
            <Typography 
                variant="h4" 
                component={motion.h4}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                gutterBottom
            >
                {ownerOnly ? 'My Auctions' : 'All Auctions'}
            </Typography>
            
            <Grid 
                container 
                spacing={3}
                component={motion.div}
                variants={container}
                initial="hidden"
                animate="show"
            >
                {auctions.map((auction) => (
                    <AuctionCard
                        key={auction.id}
                        auction={auction}
                        handleEndAuction={handleEndAuction}
                        contract={contract}
                        account={account}
                    />
                ))}
            </Grid>
        </div>
    );
}

export default AuctionList; 