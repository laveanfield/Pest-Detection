from prometheus_client import Counter, Histogram, Gauge

#===========================================
# Celery metrics
#===========================================

CELERY_TASK_SUCCESS = Counter(
    "celery_task_success_total",
    "Total successful Celery tasks",
    ["task_name"]
)

CELERY_TASK_FAILED = Counter(
    "celery_task_failed_total",
    "Total failed Celery tasks",
    ["task_name"]
)

CELERY_TASK_DURATION = Histogram(
    "celery_task_duration_seconds",
    "Time spent processing Celery tasks",
    ["task_name"],
    buckets=[1.0, 3.0, 5.0, 10.0, 30.0, 60.0]
)

CELERY_QUEUE_SIZE = Gauge(
    "celery_queue_size",
    "Number of tasks currently in Celery queue"
)

#===========================================
# ML metrics
#===========================================

INFERENCE_TIME = Histogram(
    "inference_duration_seconds",
    "Time spent running YOLO inference",
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0]
)

PEST_DETECTED = Counter(
    "pest_detected_total",
    "Total pests detected by type",
    ["pest_type"]
)

DETECTION_WITH_PEST = Counter(
    "detection_with_pest_total",
    "Images that had at least one pest detected"
)

DETECTION_WITHOUT_PEST = Counter(
    "detection_without_pest_total",
    "Images with no pest detected"
)

CONFIDENCE_SCORE = Histogram(
    "detection_confidence_score",
    "Confidence score distribution of detections",
    buckets=[0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
)

#===========================================
# Batch metrics
#===========================================

BATCH_PROCESSING_TIME = Histogram(
    "batch_processing_duration_seconds",
    "Total time to finish a batch",
    buckets=[5.0, 10.0, 30.0, 60.0, 120.0, 300.0]
)
