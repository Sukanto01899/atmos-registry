# Atmos Registry

Atmos is a Stacks mainnet data registry for atmospheric and climate datasets. It stores dataset metadata on-chain
and exposes read-only endpoints for discovery, plus write calls to register and manage datasets.

## Highlights

- On-chain metadata registry with owner indexing.
- Mainnet contract integration in the frontend.
- Stacks wallet connect and dataset registration flow.
- Clarity 3 contract compatible with epoch 3.0.

## Contract

- Contract address: `SP1G4ZDXED8XM2XJ4Q4GJ7F4PG4EJQ1KKXRCD0S3K.atmos`
- Source: `contracts/atmos.clar`
- Clarinet config: `Clarinet.toml`

### Read-only functions

- `get-contract-admin`
- `is-contract-paused`
- `get-dataset(dataset-id uint)`
- `get-datasets-by-owner(owner principal)`
- `get-dataset-count`

### Public functions

- `register-dataset(...)`
- `update-dataset-metadata(...)`
- `freeze-dataset-metadata(dataset-id uint)`
- `transfer-dataset(dataset-id uint, new-owner principal)`
- `set-contract-admin(new-admin principal)`
- `set-paused(paused bool)`

## Frontend

The UI reads directly from mainnet and lets connected wallets register new datasets.

- App entry: `src/App.tsx`
- Styles: `src/index.css`

### Wallet

The app uses Stacks Connect. Click "Connect Wallet" to authenticate, then submit datasets from the form.

## Getting Started

### Install

```
npm install
```

### Run the app

```
npm run dev
```

### Build

```
npm run build
```

## Clarinet

To generate deployment plans:

```
clarinet deployments generate --devnet --medium-cost
```

Mainnet plan config lives at `deployments/default.mainnet-plan.yaml`.

## Notes

- Latitude and longitude are stored in micro-degrees.
- `collection-date` is a user-supplied uint; `created-at` is the block height.
- Owner indexing is limited to 1000 datasets per address.
