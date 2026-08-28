import logging
import signal
import sys
import time
from uuid import UUID

from app.core.redis_client import redis_queue
from app.workers.job_worker import job_worker
from app.workers.render_worker import render_worker

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [WorkerDaemon] %(message)s",
)
logger = logging.getLogger(__name__)

running = True


def signal_handler(signum, frame):
    global running
    logger.info("Termination signal received. Shutting down worker daemon gracefully...")
    running = False


signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)


def start_worker():
    logger.info("Starting AI Video Orchestration Redis Worker Daemon...")
    logger.info("Listening on Redis task queue '%s'...", redis_queue.QUEUE_NAME)

    while running:
        try:
            job_payload = redis_queue.dequeue_job(timeout=3)
            if not job_payload:
                continue

            logger.info("Dequeued job payload: %s", job_payload)

            if "render_job_id" in job_payload:
                render_job_id = UUID(job_payload["render_job_id"])
                logger.info("Executing Render Job %s...", render_job_id)
                render_worker.process_render_job_sync(render_job_id)
                logger.info("Render Job %s completed successfully.", render_job_id)

            elif "job_id" in job_payload:
                job_id = UUID(job_payload["job_id"])
                logger.info("Executing Asset Generation Job %s...", job_id)
                job_worker.process_job_sync(job_id)
                logger.info("Asset Generation Job %s completed successfully.", job_id)

            else:
                logger.warning("Unrecognized job payload format: %s", job_payload)

        except Exception as e:
            logger.exception("Error processing queued job: %s", e)
            time.sleep(1)

    logger.info("Worker daemon stopped.")


if __name__ == "__main__":
    start_worker()
