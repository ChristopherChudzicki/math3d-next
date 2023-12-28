from emails.models import EmailDeliveries
from rest_framework.response import Response
from rest_framework import status
from rest_framework.request import Request
from datetime import datetime, timezone
import logging
from functools import wraps

logger = logging.getLogger(__name__)


class EmailDeliverabilityCheck:
    """
    A decorator for ViewSet request handlers that checks for bounce/complaint
    issues with previous email deliveries.
    """

    email_key: str
    MAX_BOUNCES: int = 3
    BOUNCE_DELAY_SECONDS: int = 24 * 3600

    def __init__(self, email_key="email"):
        self.email_key = email_key

    def __call__(self, func):
        @wraps(func)
        def decorated(instance, request: Request, *args, **kwargs):
            address = request.data[self.email_key]
            try:
                deliveries = EmailDeliveries.objects.get(email=address)
            except EmailDeliveries.DoesNotExist:
                deliveries = None

            if not deliveries or self._should_deliver(deliveries):
                return func(instance, request, *args, **kwargs)

            return Response(status=status.HTTP_204_NO_CONTENT)

        return decorated

    @classmethod
    def _should_deliver(cls, deliveries: EmailDeliveries):
        address = deliveries.email
        if deliveries.complaints > 0:
            logger.warn(f"Skipping delivery to {address} [previous complaint]")
            return False
        if deliveries.bounces >= cls.MAX_BOUNCES:
            logger.warn(f"Skipping delivery to {address} [too many bounces]")
            return False

        if 0 < deliveries.bounces < cls.MAX_BOUNCES:
            if deliveries.last_bounce:
                diff = datetime.now(timezone.utc) - deliveries.last_bounce
                if diff.total_seconds() < cls.BOUNCE_DELAY_SECONDS:
                    logger.warn(f"Skipping delivery to {address} [too recent bounce]")
                    return False

        return True
