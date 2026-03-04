;; Atmos Token Contract
;; Dedicated reward token minted by the atmos-v3 registry contract.

(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-INSUFFICIENT-BALANCE (err u402))
(define-constant REGISTRY-CONTRACT .atmos-v3)
(define-constant STAKING-CONTRACT .atmos-staking-v1)

(define-fungible-token atmos-token)

(define-read-only (get-name)
  (ok "Atmos Token")
)

(define-read-only (get-symbol)
  (ok "ATMOS")
)

(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-balance (owner principal))
  (ok (ft-get-balance atmos-token owner))
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply atmos-token))
)

(define-public (transfer (amount uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) ERR-NOT-AUTHORIZED)
    (asserts! (>= (ft-get-balance atmos-token sender) amount) ERR-INSUFFICIENT-BALANCE)
    (ft-transfer? atmos-token amount sender recipient)
  )
)

(define-public (mint-registration-reward (recipient principal) (amount uint))
  (begin
    ;; Only the atmos-v3 registry contract can mint registration rewards.
    (asserts! (is-eq contract-caller REGISTRY-CONTRACT) ERR-NOT-AUTHORIZED)
    (ft-mint? atmos-token amount recipient)
  )
)

(define-public (mint-staking-reward (recipient principal) (amount uint))
  (begin
    ;; Only the atmos-staking-v1 contract can mint APY rewards.
    (asserts! (is-eq contract-caller STAKING-CONTRACT) ERR-NOT-AUTHORIZED)
    (ft-mint? atmos-token amount recipient)
  )
)
