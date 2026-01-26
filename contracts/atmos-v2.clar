;; StratoSense - Data Registry Contract (v2)
;; Implements Clarity 3 standards

;; Error Codes
(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-DATASET-NOT-FOUND (err u404))
(define-constant ERR-INVALID-PARAMS (err u400))
(define-constant ERR-METADATA-FROZEN (err u403))
(define-constant ERR-CONTRACT-PAUSED (err u503))
(define-constant ERR-DATASET-EXISTS (err u409))

(define-constant MAX-OWNER-DATASETS u1000)
(define-constant MAX-PAGE-SIZE u100)

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

(define-read-only (get-datasets-by-owner-page (owner principal) (offset uint) (limit uint))
  (let ((all (get-owner-dataset-ids owner)))
    (let ((safe-limit (if (> limit MAX-PAGE-SIZE) MAX-PAGE-SIZE limit)))
      (let ((page (slice-list all offset safe-limit)))
        (ok {
          items: page,
          next-offset: (page-next-offset offset page (len all))
        })
      )
    )
  )
)

(define-read-only (get-dataset-ids-page (offset uint) (limit uint))
  (let ((total (var-get dataset-counter)))
    (if (or (is-eq total u0) (>= offset total))
      (ok { items: (list), next-offset: none })
      (let ((safe-limit (if (> limit MAX-PAGE-SIZE) MAX-PAGE-SIZE limit)))
        (let ((end (+ offset safe-limit)))
          (let ((last (if (> end total) total end)))
            (let ((items (range (+ offset u1) (+ last u1))))
              (ok {
                items: items,
                next-offset: (page-next-offset offset items total)
              })
            )
          )
        )
      )
    )
  )
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

(define-private (get-owner-dataset-ids (owner principal))
  (get dataset-ids (get-owner-entry owner))
)

(define-private (page-next-offset (offset uint) (page (list 1000 uint)) (total uint))
  (let ((next (+ offset (len page))))
    (if (< next total) (some next) none)
  )
)

(define-private (slice-fold (item uint) (acc (tuple (result (list 1000 uint)) (idx uint) (offset uint) (end uint))))
  (let ((idx (get idx acc)))
    (let ((next-idx (+ idx u1)))
      (if (and (>= idx (get offset acc)) (< idx (get end acc)))
        { result: (append (get result acc) item), idx: next-idx, offset: (get offset acc), end: (get end acc) }
        { result: (get result acc), idx: next-idx, offset: (get offset acc), end: (get end acc) }
      )
    )
  )
)

(define-private (slice-list (items (list 1000 uint)) (offset uint) (limit uint))
  (let ((end (+ offset limit)))
    (get result (fold slice-fold items { result: (list), idx: u0, offset: offset, end: end }))
  )
)

(define-private (add-dataset-to-owner (owner principal) (dataset-id uint))
  (let ((current (get-owner-dataset-ids owner)))
    (if (contains current dataset-id)
      (ok true)
      (match (as-max-len? (append current dataset-id) MAX-OWNER-DATASETS)
        updated (ok (map-set datasets-by-owner { owner: owner } { dataset-ids: updated }))
        (err ERR-INVALID-PARAMS)
      )
    )
  )
)

(define-private (remove-fold (item uint) (acc (tuple (result (list 1000 uint)) (target uint))))
  (if (is-eq item (get target acc))
    acc
    { result: (append (get result acc) item), target: (get target acc) }
  )
)

(define-private (remove-dataset-from-owner (owner principal) (dataset-id uint))
  (let ((current (get-owner-dataset-ids owner)))
    (let ((updated (get result (fold remove-fold current { result: (list), target: dataset-id }))))
      (map-set datasets-by-owner { owner: owner } { dataset-ids: updated })
    )
  )
)

(define-private (is-valid-status (status (string-ascii 20)))
  (or (is-eq status "active") (is-eq status "deprecated"))
)

(define-private (validate-fields
  (name (string-utf8 100))
  (description (string-utf8 500))
  (data-type (string-utf8 50))
  (collection-date uint)
  (altitude-min uint)
  (altitude-max uint)
  (latitude int)
  (longitude int)
  (ipfs-hash (string-ascii 100))
  (status (string-ascii 20)))
  (and
    (>= (len name) u1)
    (>= (len description) u1)
    (>= (len data-type) u1)
    (> collection-date u0)
    (>= altitude-max altitude-min)
    (and (>= latitude (* -90 1000000)) (<= latitude (* 90 1000000)))
    (and (>= longitude (* -180 1000000)) (<= longitude (* 180 1000000)))
    (or (is-eq (len ipfs-hash) u0) (>= (len ipfs-hash) u1))
    (is-valid-status status)
  )
)

(define-private (check-not-paused)
  (not (var-get contract-paused))
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
    (asserts! (validate-fields name description data-type collection-date altitude-min altitude-max latitude longitude ipfs-hash "active") ERR-INVALID-PARAMS)

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
    (asserts! (and (>= (len name) u1) (>= (len description) u1) (>= (len data-type) u1)) ERR-INVALID-PARAMS)

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
    (old-owner (get owner dataset))
  )
    (asserts! (check-not-paused) ERR-CONTRACT-PAUSED)
    (asserts! (is-dataset-owner dataset-id) ERR-NOT-AUTHORIZED)

    (map-set datasets
      { dataset-id: dataset-id }
      (merge dataset { owner: new-owner })
    )

    (remove-dataset-from-owner old-owner dataset-id)
    (unwrap! (add-dataset-to-owner new-owner dataset-id) ERR-INVALID-PARAMS)
    (ok true)
  )
)

;; Admin: Import dataset (migration helper)
(define-public (import-dataset
  (dataset-id uint)
  (owner principal)
  (name (string-utf8 100))
  (description (string-utf8 500))
  (data-type (string-utf8 50))
  (collection-date uint)
  (altitude-min uint)
  (altitude-max uint)
  (latitude int)
  (longitude int)
  (ipfs-hash (string-ascii 100))
  (is-public bool)
  (metadata-frozen bool)
  (created-at uint)
  (status (string-ascii 20)))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-admin)) ERR-NOT-AUTHORIZED)
    (asserts! (check-not-paused) ERR-CONTRACT-PAUSED)
    (asserts! (> dataset-id u0) ERR-INVALID-PARAMS)
    (asserts! (is-none (map-get? datasets { dataset-id: dataset-id })) ERR-DATASET-EXISTS)
    (asserts! (validate-fields name description data-type collection-date altitude-min altitude-max latitude longitude ipfs-hash status) ERR-INVALID-PARAMS)

    (map-set datasets
      { dataset-id: dataset-id }
      {
        owner: owner,
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
        metadata-frozen: metadata-frozen,
        created-at: created-at,
        status: status
      }
    )

    (unwrap! (add-dataset-to-owner owner dataset-id) ERR-INVALID-PARAMS)

    (if (> dataset-id (var-get dataset-counter))
      (var-set dataset-counter dataset-id)
      true
    )

    (ok dataset-id)
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
