;; Atmos Staking Contract (v1)
;; Users stake ATMOS token and earn APY rewards over time.

(define-constant ERR-INVALID-AMOUNT (err u400))
(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-INSUFFICIENT-STAKE (err u402))
(define-constant ERR-TOKEN-TRANSFER-FAILED (err u500))
(define-constant ERR-REWARD-MINT-FAILED (err u501))
(define-constant ERR-INVALID-APY (err u502))

(define-constant BPS-DENOMINATOR u10000)
(define-constant BLOCKS-PER-YEAR u52560) ;; Approx 10-minute block target.
(define-constant MAX-APY-BPS u5000) ;; 50%

(define-data-var contract-admin principal tx-sender)
(define-data-var apy-bps uint u1200) ;; 12% APY default
(define-data-var total-staked uint u0)

(define-map stakes
  { staker: principal }
  {
    amount: uint,
    last-claim-block: uint,
    total-claimed: uint,
  }
)

(define-read-only (get-apy-bps)
  (ok (var-get apy-bps))
)

(define-read-only (get-total-staked)
  (ok (var-get total-staked))
)

(define-read-only (get-stake-info (staker principal))
  (default-to {
      amount: u0,
      last-claim-block: burn-block-height,
      total-claimed: u0,
    }
    (map-get? stakes { staker: staker })
  )
)

(define-read-only (get-pending-reward (staker principal))
  (let ((entry (get-stake-info staker)))
    (ok (calculate-reward (get amount entry) (get last-claim-block entry)))
  )
)

(define-private (calculate-reward (amount uint) (from-block uint))
  (let (
      (elapsed (- burn-block-height from-block))
      (annualized (* amount (var-get apy-bps)))
      (numerator (* annualized elapsed))
      (denominator (* BPS-DENOMINATOR BLOCKS-PER-YEAR))
    )
    (/ numerator denominator)
  )
)

(define-private (mint-pending-reward (staker principal) (entry {
    amount: uint,
    last-claim-block: uint,
    total-claimed: uint,
  }))
  (let ((pending (calculate-reward (get amount entry) (get last-claim-block entry))))
    (begin
      (if (> pending u0)
        (try! (contract-call? .atmos-token-v4 mint-staking-reward staker pending))
        true
      )
      (ok pending)
    )
  )
)

(define-public (stake (amount uint))
  (let ((existing (get-stake-info tx-sender)))
    (let ((pending (unwrap! (mint-pending-reward tx-sender existing) ERR-REWARD-MINT-FAILED)))
      (begin
        (asserts! (> amount u0) ERR-INVALID-AMOUNT)
        (unwrap! (contract-call? .atmos-token-v4 transfer amount tx-sender .atmos-staking-v4)
          ERR-TOKEN-TRANSFER-FAILED
        )
        (map-set stakes
          { staker: tx-sender }
          {
            amount: (+ (get amount existing) amount),
            last-claim-block: burn-block-height,
            total-claimed: (+ (get total-claimed existing) pending),
          }
        )
        (var-set total-staked (+ (var-get total-staked) amount))
        (ok {
          staked: amount,
          pending-claimed: pending,
        })
      )
    )
  )
)

(define-public (claim-rewards)
  (let ((existing (get-stake-info tx-sender)))
    (let ((pending (unwrap! (mint-pending-reward tx-sender existing) ERR-REWARD-MINT-FAILED)))
      (begin
        (map-set stakes
          { staker: tx-sender }
          {
            amount: (get amount existing),
            last-claim-block: burn-block-height,
            total-claimed: (+ (get total-claimed existing) pending),
          }
        )
        (ok pending)
      )
    )
  )
)

(define-public (unstake (amount uint))
  (let (
      (staker tx-sender)
      (existing (get-stake-info tx-sender))
    )
    (let (
        (current-amount (get amount existing))
        (pending (unwrap! (mint-pending-reward staker existing) ERR-REWARD-MINT-FAILED))
      )
      (begin
        (asserts! (> amount u0) ERR-INVALID-AMOUNT)
        (asserts! (>= current-amount amount) ERR-INSUFFICIENT-STAKE)
        (try! (as-contract (contract-call? .atmos-token-v4 transfer amount .atmos-staking-v4 staker)))
        (map-set stakes
          { staker: staker }
          {
            amount: (- current-amount amount),
            last-claim-block: burn-block-height,
            total-claimed: (+ (get total-claimed existing) pending),
          }
        )
        (var-set total-staked (- (var-get total-staked) amount))
        (ok {
          unstaked: amount,
          pending-claimed: pending,
        })
      )
    )
  )
)

(define-public (set-apy-bps (new-apy-bps uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-admin)) ERR-NOT-AUTHORIZED)
    (asserts! (<= new-apy-bps MAX-APY-BPS) ERR-INVALID-APY)
    (var-set apy-bps new-apy-bps)
    (ok new-apy-bps)
  )
)





