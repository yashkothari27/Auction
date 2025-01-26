import React, { useState } from 'react';
import { ethers } from 'ethers';
import {
    Paper,
    TextField,
    Button,
    Box,
    Typography,
    CircularProgress
} from '@mui/material';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`,
  backdropFilter: 'blur(10px)',
  borderRadius: 24,
  padding: theme.spacing(4),
}));

function CreateAuction({ contract }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const tx = await contract.createAuction(
                title,
                description,
                ethers.BigNumber.from(duration * 3600)
            );
            toast.info('Creating auction... Please wait');
            await tx.wait();
            toast.success('Auction created successfully!');
            
            // Reset form
            setTitle('');
            setDescription('');
            setDuration('');
        } catch (error) {
            console.error('Error creating auction:', error);
            toast.error(error.message || 'Failed to create auction');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <StyledPaper elevation={3} sx={{ maxWidth: 600, mx: 'auto' }}>
                <Typography variant="h5" component="h2" gutterBottom fontWeight="bold">
                    Create New Auction
                </Typography>
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{
                        mt: 2,
                        '& .MuiTextField-root': {
                            mb: 2,
                        },
                    }}
                >
                    <TextField
                        fullWidth
                        label="Auction Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        margin="normal"
                        required
                        disabled={loading}
                    />
                    <TextField
                        fullWidth
                        label="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        margin="normal"
                        multiline
                        rows={4}
                        required
                        disabled={loading}
                    />
                    <TextField
                        fullWidth
                        type="number"
                        label="Duration (hours)"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        margin="normal"
                        required
                        disabled={loading}
                        InputProps={{ inputProps: { min: 1 } }}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        size="large"
                        disabled={loading}
                        sx={{
                            mt: 3,
                            py: 1.5,
                            fontSize: '1.1rem',
                        }}
                    >
                        {loading ? (
                            <CircularProgress size={24} color="inherit" />
                        ) : (
                            'Create Auction'
                        )}
                    </Button>
                </Box>
            </StyledPaper>
        </motion.div>
    );
}

export default CreateAuction; 