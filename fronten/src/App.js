import React, { useState, useEffect } from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider, gql, useQuery } from '@apollo/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { 
  AppBar, Toolbar, Typography, Button, Card, CardContent, 
  TextField, Grid, CircularProgress, Container, IconButton
} from '@mui/material';
import { Brightness4, Brightness7, Search } from '@mui/icons-material';
import { connectWallet, disconnectWallet } from './utils/web3';
import { storeFiles } from './utils/ipfs';

const client = new ApolloClient({
  uri: 'https://api.studio.thegraph.com/query/92923/memory/version/latest',
  cache: new InMemoryCache(),
});

const GET_MEMORIES = gql`
  query GetMemories($eventType: String, $date: BigInt) {
    memoryMinteds(
      where: {
        eventType_contains_nocase: $eventType,
        date_gte: $date
      },
      orderBy: date,
      orderDirection: desc
    ) {
      id
      ipfsHash
      eventType
      date
      creator
      tokenId
    }
  }
`;

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [searchParams, setSearchParams] = useState({ eventType: '', date: '' });
  const [filteredMemories, setFilteredMemories] = useState(null);

  const { data, loading, error, refetch } = useQuery(GET_MEMORIES, {
    variables: { 
      eventType: '',
      date: 0
    },
  });

  useEffect(() => {
    if (data && data.memoryMinteds) {
      setFilteredMemories(data.memoryMinteds);
    }
  }, [data]);

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
    },
  });

  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleConnect = async () => {
    try {
      const { account: connectedAccount, contract: connectedContract } = await connectWallet();
      setAccount(connectedAccount);
      setContract(connectedContract);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      setAccount(null);
      setContract(null);
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!data || !data.memoryMinteds) return;

    const filtered = data.memoryMinteds.filter(memory => {
      const matchesEventType = searchParams.eventType === '' || 
        memory.eventType.toLowerCase().includes(searchParams.eventType.toLowerCase());
      
      const matchesDate = searchParams.date === '' || 
        formatDate(memory.date) === formatDate(new Date(searchParams.date).getTime() / 1000);

      return matchesEventType && matchesDate;
    });

    setFilteredMemories(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const file = form.file.files[0];
    const eventType = form.eventType.value;
    const date = form.date.value;
    const tags = form.tags.value.split(',').map(tag => tag.trim());

    if (!file || !eventType || !date || !tags.length || !contract) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const cid = await storeFiles(file);
      const dateTimestamp = Math.floor(new Date(date).getTime() / 1000);
      const tx = await contract.mintMemory(cid, eventType, dateTimestamp, tags);
      await tx.wait();
      alert('Memory minted successfully!');
      form.reset();
      refetch();
    } catch (error) {
      console.error('Error minting memory:', error);
      alert('Error minting memory. Please try again.');
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(Number(timestamp) * 1000);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container>
        <AppBar position="static" color="default" elevation={0}>
          <Toolbar>
            <Typography variant="h6" style={{ flexGrow: 1 }}>
              NITK Memory Vault
            </Typography>
            <IconButton onClick={toggleDarkMode} color="inherit">
              {isDarkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
            {account ? (
              <Button onClick={handleDisconnect} color="inherit">Disconnect Wallet</Button>
            ) : (
              <Button onClick={handleConnect} color="inherit">Connect Wallet</Button>
            )}
          </Toolbar>
        </AppBar>

        {account && (
          <Card style={{ marginTop: '20px', marginBottom: '20px' }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Mint New Memory
              </Typography>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <input type="file" name="file" required />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth name="eventType" label="Event Type" required />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="date"
                      type="date"
                      required
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth name="tags" label="Tags (comma-separated)" required />
                  </Grid>
                  <Grid item xs={12}>
                    <Button type="submit" variant="contained" color="primary">
                      Mint Memory
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        )}

        <Card style={{ marginBottom: '20px' }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Search Memories
            </Typography>
            <form onSubmit={handleSearch}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={5}>
                  <TextField
                    fullWidth
                    label="Event Type"
                    value={searchParams.eventType}
                    onChange={(e) => setSearchParams({ ...searchParams, eventType: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={5}>
                  <TextField
                    fullWidth
                    label="Date"
                    type="date"
                    value={searchParams.date}
                    onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Button type="submit" variant="contained" color="primary" startIcon={<Search />}>
                    Search
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>

        {loading && <CircularProgress />}
        {error && <Typography color="error">Error: {error.message}</Typography>}
        {filteredMemories && (
          <Grid container spacing={2}>
            {filteredMemories.map((memory) => (
              <Grid item xs={12} sm={6} md={4} key={memory.id}>
                <Card>
                  <CardContent>
                    <img
                      src={`https://ipfs.io/ipfs/${memory.ipfsHash}`}
                      alt={`Memory ${memory.tokenId}`}
                      style={{ width: '100%', height: '200px', objectFit: 'cover', marginBottom: '10px' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder.svg?height=200&width=200';
                      }}
                    />
                    <Typography><strong>Token ID:</strong> {memory.tokenId}</Typography>
                    <Typography><strong>Event Type:</strong> {memory.eventType}</Typography>
                    <Typography><strong>Date:</strong> {formatDate(memory.date)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
        {filteredMemories && filteredMemories.length === 0 && (
          <Typography>No memories found.</Typography>
        )}
      </Container>
    </ThemeProvider>
  );
}

function AppWithApollo() {
  return (
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  );
}

export default AppWithApollo;