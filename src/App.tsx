import React, { useEffect, useMemo, useState } from 'react';
import { AppConfig, UserSession } from '@stacks/auth';
import { showConnect, openContractCall } from '@stacks/connect';
import { StacksMainnet } from '@stacks/network';
import {
    boolCV,
    callReadOnlyFunction,
    cvToJSON,
    intCV,
    principalCV,
    stringAsciiCV,
    stringUtf8CV,
    uintCV,
} from '@stacks/transactions';

const CONTRACT_ADDRESS = 'SP1G4ZDXED8XM2XJ4Q4GJ7F4PG4EJQ1KKXRCD0S3K';
const CONTRACT_NAME = 'atmos';
const network = new StacksMainnet();
const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

type Dataset = {
    id: number;
    name: string;
    description: string;
    dataType: string;
    collectionDate: number;
    altitudeMin: number;
    altitudeMax: number;
    latitude: number;
    longitude: number;
    ipfsHash: string;
    isPublic: boolean;
    metadataFrozen: boolean;
    createdAt: number;
    owner: string;
    status: string;
};

type RegisterFormState = {
    name: string;
    description: string;
    dataType: string;
    collectionDate: string;
    altitudeMin: string;
    altitudeMax: string;
    latitude: string;
    longitude: string;
    ipfsHash: string;
    isPublic: boolean;
};

const defaultRegisterForm: RegisterFormState = {
    name: '',
    description: '',
    dataType: '',
    collectionDate: '',
    altitudeMin: '',
    altitudeMax: '',
    latitude: '',
    longitude: '',
    ipfsHash: '',
    isPublic: true,
};

const unwrapResponseOk = (cv: unknown) => {
    const json = cvToJSON(cv as any) as any;
    if (json.type !== 'response') {
        return json;
    }
    if (json.value.type !== 'ok') {
        throw new Error('Read-only call returned err');
    }
    return json.value.value;
};

const parseTuple = (tuple: any, id: number): Dataset | null => {
    if (!tuple || tuple.type !== 'tuple') {
        return null;
    }
    const data = tuple.value ?? {};
    const getString = (key: string) => String(data[key]?.value ?? '');
    const getBool = (key: string) => Boolean(data[key]?.value ?? false);
    const getNum = (key: string) => Number.parseInt(String(data[key]?.value ?? '0'), 10);

    return {
        id,
        name: getString('name'),
        description: getString('description'),
        dataType: getString('data-type'),
        collectionDate: getNum('collection-date'),
        altitudeMin: getNum('altitude-min'),
        altitudeMax: getNum('altitude-max'),
        latitude: getNum('latitude'),
        longitude: getNum('longitude'),
        ipfsHash: getString('ipfs-hash'),
        isPublic: getBool('is-public'),
        metadataFrozen: getBool('metadata-frozen'),
        createdAt: getNum('created-at'),
        owner: getString('owner'),
        status: getString('status'),
    };
};

const formatCoord = (value: number) => (value / 1_000_000).toFixed(3);

const getUserAddress = () => {
    if (!userSession.isUserSignedIn()) {
        return '';
    }
    try {
        const userData = userSession.loadUserData();
        const profile = userData?.profile as any;
        return profile?.stxAddress?.mainnet ?? profile?.stxAddress?.testnet ?? '';
    } catch {
        return '';
    }
};

const getAppIcon = () => {
    try {
        return `${window.location.origin}/vite.svg`;
    } catch {
        return '';
    }
};

function App() {
    const [activeTab, setActiveTab] = useState<'explore' | 'mine'>('explore');
    const [datasetCount, setDatasetCount] = useState<number | null>(null);
    const [latestDatasets, setLatestDatasets] = useState<Dataset[]>([]);
    const [myDatasets, setMyDatasets] = useState<Dataset[]>([]);
    const [ownerInput, setOwnerInput] = useState('');
    const [ownerAddress, setOwnerAddress] = useState('');
    const [queryId, setQueryId] = useState('');
    const [queryResult, setQueryResult] = useState<Dataset | null>(null);
    const [loading, setLoading] = useState(false);
    const [queryLoading, setQueryLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [walletMessage, setWalletMessage] = useState('');
    const [txStatus, setTxStatus] = useState('');
    const [walletAddress, setWalletAddress] = useState('');
    const [registerForm, setRegisterForm] = useState<RegisterFormState>(defaultRegisterForm);

    const stats = useMemo(() => ([
        {
            label: 'Total datasets on-chain',
            value: datasetCount === null ? 'Loading...' : datasetCount.toLocaleString(),
            note: 'Mainnet - Atmos',
        },
        {
            label: 'Registry status',
            value: 'Operational',
            note: 'Anchored on Stacks',
        },
        {
            label: 'Data coverage',
            value: 'Global mesh',
            note: 'Climate and Atmosphere',
        },
    ]), [datasetCount]);

    const senderAddress = walletAddress || ownerAddress || CONTRACT_ADDRESS;
    const activeDatasets = activeTab === 'explore' ? latestDatasets : myDatasets;

    const fetchDataset = async (datasetId: number) => {
        const response = await callReadOnlyFunction({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'get-dataset',
            functionArgs: [uintCV(datasetId)],
            senderAddress,
            network,
        });
        const okValue = unwrapResponseOk(response);
        const dataset = parseTuple(okValue, datasetId);
        return dataset;
    };

    const loadLatest = async () => {
        setLoading(true);
        setStatusMessage('');
        try {
            const countResponse = await callReadOnlyFunction({
                contractAddress: CONTRACT_ADDRESS,
                contractName: CONTRACT_NAME,
                functionName: 'get-dataset-count',
                functionArgs: [],
                senderAddress: CONTRACT_ADDRESS,
                network,
            });
            const countValue = unwrapResponseOk(countResponse);
            const total = Number.parseInt(String(countValue.value ?? '0'), 10);
            setDatasetCount(total);

            if (total === 0) {
                setLatestDatasets([]);
                return;
            }
            const ids = Array.from({ length: Math.min(4, total) }, (_, index) => total - index);
            const results = await Promise.all(ids.map((id) => fetchDataset(id)));
            setLatestDatasets(results.filter((item): item is Dataset => Boolean(item)));
        } catch (error) {
            setStatusMessage('Unable to load datasets from mainnet. Check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const loadOwnerDatasets = async (address: string) => {
        setStatusMessage('');
        setLoading(true);
        try {
            const response = await callReadOnlyFunction({
                contractAddress: CONTRACT_ADDRESS,
                contractName: CONTRACT_NAME,
                functionName: 'get-datasets-by-owner',
                functionArgs: [principalCV(address)],
                senderAddress: address,
                network,
            });
            const json = cvToJSON(response as any) as any;
            if (json.type !== 'list') {
                setMyDatasets([]);
                return;
            }
            const ids = (json.value ?? []).map((item: any) => Number.parseInt(String(item.value ?? '0'), 10));
            const limited = ids.slice(0, 8);
            const results = await Promise.all(limited.map((id) => fetchDataset(id)));
            setMyDatasets(results.filter((item): item is Dataset => Boolean(item)));
        } catch (error) {
            setStatusMessage('Unable to load datasets for that address.');
        } finally {
            setLoading(false);
        }
    };

    const handleLookup = async () => {
        const parsed = Number.parseInt(queryId, 10);
        if (!parsed || parsed < 1) {
            setStatusMessage('Enter a valid dataset id.');
            return;
        }
        setQueryLoading(true);
        setStatusMessage('');
        try {
            const dataset = await fetchDataset(parsed);
            setQueryResult(dataset);
            if (!dataset) {
                setStatusMessage('Dataset not found.');
            }
        } catch (error) {
            setStatusMessage('Dataset not found.');
        } finally {
            setQueryLoading(false);
        }
    };

    const handleOwnerSubmit = () => {
        if (!ownerInput.trim()) {
            setStatusMessage('Paste a Stacks address to load your datasets.');
            return;
        }
        setOwnerAddress(ownerInput.trim());
        loadOwnerDatasets(ownerInput.trim());
    };

    const connectWallet = () => {
        setWalletMessage('');
        showConnect({
            userSession,
            appDetails: {
                name: 'Atmos Registry',
                icon: getAppIcon(),
            },
            onFinish: () => {
                const address = getUserAddress();
                setWalletAddress(address);
                setWalletMessage(address ? 'Wallet connected.' : 'Wallet connected, address unavailable.');
                if (address) {
                    setOwnerInput(address);
                }
            },
            onCancel: () => {
                setWalletMessage('Wallet connection canceled.');
            },
        });
    };

    const disconnectWallet = () => {
        userSession.signUserOut(window.location.origin);
        setWalletAddress('');
        setWalletMessage('Wallet disconnected.');
    };

    const handleRegisterSubmit = async () => {
        if (!walletAddress) {
            setWalletMessage('Connect your wallet to register a dataset.');
            return;
        }

        const collectionDate = Number.parseInt(registerForm.collectionDate, 10);
        const altitudeMin = Number.parseInt(registerForm.altitudeMin, 10);
        const altitudeMax = Number.parseInt(registerForm.altitudeMax, 10);
        const latitude = Math.round(Number.parseFloat(registerForm.latitude) * 1_000_000);
        const longitude = Math.round(Number.parseFloat(registerForm.longitude) * 1_000_000);

        if (!registerForm.name || !registerForm.description || !registerForm.dataType) {
            setTxStatus('Name, description, and data type are required.');
            return;
        }
        if (Number.isNaN(collectionDate) || Number.isNaN(altitudeMin) || Number.isNaN(altitudeMax)) {
            setTxStatus('Collection date and altitude values must be numbers.');
            return;
        }
        if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
            setTxStatus('Latitude and longitude must be numbers.');
            return;
        }
        if (altitudeMin < 0 || altitudeMax < altitudeMin) {
            setTxStatus('Altitude must be a positive range.');
            return;
        }
        if (latitude < -90_000_000 || latitude > 90_000_000 || longitude < -180_000_000 || longitude > 180_000_000) {
            setTxStatus('Latitude or longitude is out of bounds.');
            return;
        }

        setTxStatus('Opening wallet for transaction approval...');
        await openContractCall({
            network,
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'register-dataset',
            functionArgs: [
                stringUtf8CV(registerForm.name),
                stringUtf8CV(registerForm.description),
                stringUtf8CV(registerForm.dataType),
                uintCV(collectionDate),
                uintCV(altitudeMin),
                uintCV(altitudeMax),
                intCV(latitude),
                intCV(longitude),
                stringAsciiCV(registerForm.ipfsHash || ''),
                boolCV(registerForm.isPublic),
            ],
            postConditions: [],
            onFinish: (data) => {
                setTxStatus(`Transaction submitted: ${data.txId}`);
                loadLatest();
                setRegisterForm(defaultRegisterForm);
            },
            onCancel: () => {
                setTxStatus('Transaction canceled.');
            },
        });
    };

    useEffect(() => {
        const hydrateSession = async () => {
            if (userSession.isSignInPending()) {
                try {
                    await userSession.handlePendingSignIn();
                } catch (error) {
                    setWalletMessage('Wallet sign-in failed. Try connecting again.');
                }
            }
            if (userSession.isUserSignedIn()) {
                const address = getUserAddress();
                setWalletAddress(address);
            }
        };

        hydrateSession();
        loadLatest();
    }, []);

    return (
        <div className="app">
            <div className="glow-layer" />
            <nav className="nav">
                <div className="nav__brand">
                    <div className="logo-orb">A</div>
                    <div>
                        <div className="brand-title">Atmos Registry</div>
                        <div className="brand-subtitle">Mainnet data mesh</div>
                    </div>
                </div>
                <div className="nav__actions">
                    <button
                        className={`tab-btn ${activeTab === 'explore' ? 'active' : ''}`}
                        onClick={() => setActiveTab('explore')}
                    >
                        Explore
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'mine' ? 'active' : ''}`}
                        onClick={() => setActiveTab('mine')}
                    >
                        My Datasets
                    </button>
                    <button className="ghost-btn" onClick={loadLatest} disabled={loading}>
                        {loading ? 'Syncing...' : 'Sync Mainnet'}
                    </button>
                    {walletAddress ? (
                        <div className="wallet-chip">
                            <span className="wallet-address">{walletAddress}</span>
                            <button className="ghost-btn" onClick={disconnectWallet}>
                                Disconnect
                            </button>
                        </div>
                    ) : (
                        <button className="primary-btn compact" onClick={connectWallet}>
                            Connect Wallet
                        </button>
                    )}
                </div>
            </nav>

            <main className="container">
                <section className="hero">
                    <div className="hero__content">
                        <p className="eyebrow">Atmospheric data registry</p>
                        <h1>Trusted climate signals, anchored on Stacks.</h1>
                        <p className="hero__subtitle">
                            Browse datasets, verify provenance, and register new records directly from the Atmos
                            mainnet contract.
                        </p>
                        <div className="hero__actions">
                            <button className="primary-btn" onClick={loadLatest} disabled={loading}>
                                {loading ? 'Fetching data...' : 'Refresh on-chain data'}
                            </button>
                            <div className="contract-pill">
                                <span>Mainnet contract</span>
                                <strong>{CONTRACT_ADDRESS}.{CONTRACT_NAME}</strong>
                            </div>
                        </div>
                        {walletMessage && <div className="status-banner">{walletMessage}</div>}
                    </div>
                    <div className="hero__panel">
                        <div className="panel-title">Lookup a dataset</div>
                        <p className="panel-subtitle">Fetch a single dataset by id from the registry.</p>
                        <div className="field-row">
                            <input
                                value={queryId}
                                onChange={(event) => setQueryId(event.target.value)}
                                placeholder="Dataset id (e.g. 12)"
                            />
                            <button className="primary-btn compact" onClick={handleLookup} disabled={queryLoading}>
                                {queryLoading ? 'Checking...' : 'Lookup'}
                            </button>
                        </div>
                        {queryResult && (
                            <div className="mini-card">
                                <div className="mini-title">{queryResult.name}</div>
                                <div className="mini-meta">
                                    <span>{queryResult.dataType}</span>
                                    <span>{queryResult.status}</span>
                                </div>
                                <div className="mini-body">{queryResult.description}</div>
                            </div>
                        )}
                    </div>
                </section>

                <section className="stats-grid">
                    {stats.map((stat) => (
                        <div key={stat.label} className="stat-card">
                            <div className="stat-label">{stat.label}</div>
                            <div className="stat-value">{stat.value}</div>
                            <div className="stat-note">{stat.note}</div>
                        </div>
                    ))}
                </section>

                {statusMessage && (
                    <div className="status-banner">
                        {statusMessage}
                    </div>
                )}

                <section className="section">
                    <div className="section-header">
                        <div>
                            <h2>{activeTab === 'explore' ? 'Latest submissions' : 'Your datasets'}</h2>
                            <p>
                                {activeTab === 'explore'
                                    ? 'The most recent records pushed to Atmos on mainnet.'
                                    : 'Load datasets indexed to a specific Stacks address.'}
                            </p>
                        </div>
                        {activeTab === 'mine' && (
                            <div className="owner-form">
                                <input
                                    value={ownerInput}
                                    onChange={(event) => setOwnerInput(event.target.value)}
                                    placeholder="Paste your Stacks address"
                                />
                                <button className="primary-btn compact" onClick={handleOwnerSubmit} disabled={loading}>
                                    Load
                                </button>
                                {walletAddress && (
                                    <button
                                        className="ghost-btn"
                                        onClick={() => {
                                            setOwnerInput(walletAddress);
                                            setOwnerAddress(walletAddress);
                                            loadOwnerDatasets(walletAddress);
                                        }}
                                    >
                                        Use wallet
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="dataset-grid">
                        {activeDatasets.length === 0 && (
                            <div className="dataset-card">
                                <div className="dataset-title">No datasets loaded yet</div>
                                <p className="dataset-description">
                                    {activeTab === 'explore'
                                        ? 'Refresh to pull the latest records from mainnet.'
                                        : 'Paste a Stacks address to load datasets tied to that owner.'}
                                </p>
                            </div>
                        )}
                        {activeDatasets.map((dataset) => (
                            <article key={`${activeTab}-${dataset.id}`} className="dataset-card">
                                <div className="dataset-header">
                                    <div>
                                        <div className="dataset-title">{dataset.name}</div>
                                        <div className="dataset-tags">
                                            <span className="tag">{dataset.dataType}</span>
                                            <span className={`tag ${dataset.isPublic ? 'tag--public' : 'tag--private'}`}>
                                                {dataset.isPublic ? 'Public' : 'Private'}
                                            </span>
                                            {dataset.metadataFrozen && <span className="tag tag--frozen">Frozen</span>}
                                        </div>
                                    </div>
                                    <span className={`status-pill ${dataset.status === 'active' ? 'status--active' : 'status--deprecated'}`}>
                                        {dataset.status}
                                    </span>
                                </div>
                                <p className="dataset-description">{dataset.description}</p>
                                <div className="dataset-meta">
                                    <div>
                                        <span>Owner</span>
                                        <strong>{dataset.owner}</strong>
                                    </div>
                                    <div>
                                        <span>Location</span>
                                        <strong>{formatCoord(dataset.latitude)} deg, {formatCoord(dataset.longitude)} deg</strong>
                                    </div>
                                    <div>
                                        <span>Altitude</span>
                                        <strong>{dataset.altitudeMin}-{dataset.altitudeMax} m</strong>
                                    </div>
                                </div>
                                <div className="dataset-foot">
                                    <span>Collection date: {dataset.collectionDate}</span>
                                    <span>Record height: {dataset.createdAt}</span>
                                    <span className="hash">IPFS: {dataset.ipfsHash || 'n/a'}</span>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="section">
                    <div className="section-header">
                        <div>
                            <h2>Register a dataset</h2>
                            <p>Submit a new dataset to the Atmos mainnet registry.</p>
                        </div>
                    </div>
                    <div className="form-grid">
                        <div className="form-card">
                            <div className="field-grid">
                                <input
                                    value={registerForm.name}
                                    onChange={(event) => setRegisterForm((prev) => ({ ...prev, name: event.target.value }))}
                                    placeholder="Dataset name"
                                />
                                <input
                                    value={registerForm.dataType}
                                    onChange={(event) => setRegisterForm((prev) => ({ ...prev, dataType: event.target.value }))}
                                    placeholder="Data type"
                                />
                                <textarea
                                    value={registerForm.description}
                                    onChange={(event) => setRegisterForm((prev) => ({ ...prev, description: event.target.value }))}
                                    placeholder="Short description"
                                    rows={4}
                                />
                                <div className="field-row">
                                    <input
                                        value={registerForm.collectionDate}
                                        onChange={(event) => setRegisterForm((prev) => ({ ...prev, collectionDate: event.target.value }))}
                                        placeholder="Collection date (unix or block height)"
                                    />
                                    <input
                                        value={registerForm.ipfsHash}
                                        onChange={(event) => setRegisterForm((prev) => ({ ...prev, ipfsHash: event.target.value }))}
                                        placeholder="IPFS hash"
                                    />
                                </div>
                                <div className="field-row">
                                    <input
                                        value={registerForm.altitudeMin}
                                        onChange={(event) => setRegisterForm((prev) => ({ ...prev, altitudeMin: event.target.value }))}
                                        placeholder="Altitude min (m)"
                                    />
                                    <input
                                        value={registerForm.altitudeMax}
                                        onChange={(event) => setRegisterForm((prev) => ({ ...prev, altitudeMax: event.target.value }))}
                                        placeholder="Altitude max (m)"
                                    />
                                </div>
                                <div className="field-row">
                                    <input
                                        value={registerForm.latitude}
                                        onChange={(event) => setRegisterForm((prev) => ({ ...prev, latitude: event.target.value }))}
                                        placeholder="Latitude (deg)"
                                    />
                                    <input
                                        value={registerForm.longitude}
                                        onChange={(event) => setRegisterForm((prev) => ({ ...prev, longitude: event.target.value }))}
                                        placeholder="Longitude (deg)"
                                    />
                                </div>
                                <label className="checkbox-row">
                                    <input
                                        type="checkbox"
                                        checked={registerForm.isPublic}
                                        onChange={(event) => setRegisterForm((prev) => ({ ...prev, isPublic: event.target.checked }))}
                                    />
                                    <span>Mark dataset as public</span>
                                </label>
                            </div>
                            <div className="form-actions">
                                <button className="primary-btn" onClick={handleRegisterSubmit}>
                                    Submit dataset
                                </button>
                                {txStatus && <div className="form-note">{txStatus}</div>}
                            </div>
                        </div>
                        <div className="form-card form-card--info">
                            <h3>Registry requirements</h3>
                            <ul>
                                <li>Latitude and longitude are stored in micro-degrees.</li>
                                <li>Altitude range must be positive and ordered.</li>
                                <li>Metadata can be frozen later by the dataset owner.</li>
                                <li>IPFS hash is optional but recommended.</li>
                            </ul>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default App;
