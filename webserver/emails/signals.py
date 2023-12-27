from django_ses.signals import bounce_received, complaint_received
from django.dispatch import receiver
import logging

logger = logging.getLogger(__name__)


@receiver(bounce_received)
def bounce_handler(sender, mail_obj, bounce_obj, raw_message, *args, **kwargs):
    logger.warn("[bounce] mail_obj...")
    logger.warn(mail_obj)


@receiver(complaint_received)
def complaint_handler(sender, mail_obj, complaint_obj, raw_message, *args, **kwargs):
    logger.warn("[compaint] mail_obj...")
    logger.warn(mail_obj)
