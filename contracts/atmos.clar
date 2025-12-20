;; StratoSense - Data Registry Contract
;; Implements Clarity 3 standards

;; Error Codes
(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-DATASET-NOT-FOUND (err u404))
(define-constant ERR-INVALID-PARAMS (err u400))
(define-constant ERR-METADATA-FROZEN (err u403))
(define-constant ERR-CONTRACT-PAUSED (err u503))

;; Data Vars
(define-data-var dataset-counter uint u0)
(define-data-var contract-admin principal tx-sender)
(define-data-var contract-paused bool false)

;; Dataset Map
(define-map datasets
  { dataset-id: uint }
  {
    owner: principal,
    name: (string-utf8 100),
    description: (string-utf8 500),
    data-type: (string-utf8 50),
    collection-date: uint,
    altitude-min: uint,
    altitude-max: uint,
    latitude: int,
    longitude: int,
    ipfs-hash: (string-ascii 100),
    is-public: bool,
    metadata-frozen: bool,
    created-at: uint,
    status: (string-ascii 20) ;; "active", "deprecated"
  }
)

;; Datasets by Owner Map
(define-map datasets-by-owner
  { owner: principal }
  { dataset-ids: (list 1000 uint) }
)

;; --- Read-Only Functions ---

(define-read-only (get-contract-admin)
  (ok (var-get contract-admin))
)

(define-read-only (is-contract-paused)
  (ok (var-get contract-paused))
)

(define-read-only (get-dataset (dataset-id uint))
  (match (map-get? datasets { dataset-id: dataset-id })
    data (ok data)
    (err ERR-DATASET-NOT-FOUND)
  )
)

(define-read-only (get-datasets-by-owner (owner principal))
  (default-to (list) (get dataset-ids (map-get? datasets-by-owner { owner: owner })))
)

(define-read-only (get-dataset-count)
  (ok (var-get dataset-counter))
)

;; --- Private Helper Functions ---

(define-private (is-dataset-owner (dataset-id uint))
  (let ((dataset (map-get? datasets { dataset-id: dataset-id })))
    (match dataset
      data (is-eq tx-sender (get owner data))
      false
    )
  )
)

(define-private (get-owner-entry (owner principal))
  (default-to { dataset-ids: (list) } (map-get? datasets-by-owner { owner: owner }))
)

(define-private (add-dataset-to-owner (owner principal) (dataset-id uint))
  (let (
    (current (get dataset-ids (get-owner-entry owner)))
  )
    (match (as-max-len? (append current dataset-id) u1000)
      updated (ok (map-set datasets-by-owner
        { owner: owner }
        { dataset-ids: updated }
      ))
      (err ERR-INVALID-PARAMS)
    )
  )
)

(define-private (check-not-paused)
  (or (not (var-get contract-paused)) (is-eq tx-sender (var-get contract-admin)))
)

;; --- Public Functions ---

;; Register a new dataset
(define-public (register-dataset
  (name (string-utf8 100))
  (description (string-utf8 500))
  (data-type (string-utf8 50))
  (collection-date uint)
  (altitude-min uint)
  (altitude-max uint)
  (latitude int)
  (longitude int)
  (ipfs-hash (string-ascii 100))
  (is-public bool))

  (let (
    (dataset-id (+ (var-get dataset-counter) u1))
    (owner-principal tx-sender)
    (current-time burn-block-height)
  )
    (asserts! (check-not-paused) ERR-CONTRACT-PAUSED)
    (asserts! (>= altitude-min u0) ERR-INVALID-PARAMS)
    (asserts! (>= altitude-max altitude-min) ERR-INVALID-PARAMS)
    (asserts! (and (>= latitude (* -90 1000000)) (<= latitude (* 90 1000000))) ERR-INVALID-PARAMS)
    (asserts! (and (>= longitude (* -180 1000000)) (<= longitude (* 180 1000000))) ERR-INVALID-PARAMS)

    (map-set datasets
      { dataset-id: dataset-id }
      {
        owner: owner-principal,
        name: name,
        description: description,
        data-type: data-type,
        collection-date: collection-date,
        altitude-min: altitude-min,
        altitude-max: altitude-max,
        latitude: latitude,
        longitude: longitude,
        ipfs-hash: ipfs-hash,
        is-public: is-public,
        metadata-frozen: false,
        created-at: current-time,
        status: "active"
      }
    )

    (unwrap! (add-dataset-to-owner owner-principal dataset-id) ERR-INVALID-PARAMS)

    (var-set dataset-counter dataset-id)
    (ok dataset-id)
  )
)

;; Update dataset metadata
(define-public (update-dataset-metadata
  (dataset-id uint)
  (name (string-utf8 100))
  (description (string-utf8 500))
  (data-type (string-utf8 50))
  (is-public bool))
  (let ((dataset (unwrap! (map-get? datasets { dataset-id: dataset-id }) ERR-DATASET-NOT-FOUND)))
    (asserts! (check-not-paused) ERR-CONTRACT-PAUSED)
    (asserts! (is-dataset-owner dataset-id) ERR-NOT-AUTHORIZED)
    (asserts! (not (get metadata-frozen dataset)) ERR-METADATA-FROZEN)

    (map-set datasets
      { dataset-id: dataset-id }
      (merge dataset {
        name: name,
        description: description,
        data-type: data-type,
        is-public: is-public
      })
    )
    (ok true)
  )
)

;; Freeze dataset metadata
(define-public (freeze-dataset-metadata (dataset-id uint))
  (let ((dataset (unwrap! (map-get? datasets { dataset-id: dataset-id }) ERR-DATASET-NOT-FOUND)))
    (asserts! (check-not-paused) ERR-CONTRACT-PAUSED)
    (asserts! (is-dataset-owner dataset-id) ERR-NOT-AUTHORIZED)
    (map-set datasets
      { dataset-id: dataset-id }
      (merge dataset { metadata-frozen: true })
    )
    (ok true)
  )
)

;; Transfer dataset
(define-public (transfer-dataset (dataset-id uint) (new-owner principal))
  (let (
    (dataset (unwrap! (map-get? datasets { dataset-id: dataset-id }) ERR-DATASET-NOT-FOUND))
  )
    (asserts! (check-not-paused) ERR-CONTRACT-PAUSED)
    (asserts! (is-dataset-owner dataset-id) ERR-NOT-AUTHORIZED)

    (map-set datasets
      { dataset-id: dataset-id }
      (merge dataset { owner: new-owner })
    )
    (unwrap! (add-dataset-to-owner new-owner dataset-id) ERR-INVALID-PARAMS)
    (ok true)
  )
)

;; Admin: Set Contract Admin
(define-public (set-contract-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-admin)) ERR-NOT-AUTHORIZED)
    (var-set contract-admin new-admin)
    (ok new-admin)
  )
)

;; Admin: Pause/Unpause Contract
(define-public (set-paused (paused bool))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-admin)) ERR-NOT-AUTHORIZED)
    (var-set contract-paused paused)
    (ok paused)
  )
)
