import json
from typing import Any, Dict, Optional
import redis

from app.core.config import settings


class RedisQueueClient:
    QUEUE_NAME = "generation_jobs_queue"

    def __init__(self):
        self.client = redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
        )

    def enqueue_job(self, job_payload: Dict[str, Any]) -> int:
        """
        Pushes a generation job payload into the Redis FIFO queue.
        """
        payload_str = json.dumps(job_payload)
        return self.client.rpush(self.QUEUE_NAME, payload_str)

    def dequeue_job(self, timeout: int = 2) -> Optional[Dict[str, Any]]:
        """
        Pops a job from the Redis queue with a blocking timeout.
        """
        result = self.client.blpop([self.QUEUE_NAME], timeout=timeout)
        if result:
            queue_name, payload_str = result
            return json.loads(payload_str)
        return None

    def get_queue_length(self) -> int:
        return self.client.llen(self.QUEUE_NAME)


redis_queue = RedisQueueClient()
