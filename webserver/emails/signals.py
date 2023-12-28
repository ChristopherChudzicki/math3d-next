from typing import TypedDict, Callable
from django_ses.signals import bounce_received, complaint_received
from django.dispatch import receiver
from emails.models import EmailDeliveries

import logging

logger = logging.getLogger(__name__)

AwsSesMailObject = TypedDict(
    "AwsSesMailObject", {"timestamp": str, "source": str, "destination": list[str]}
)

AwsSesBouncedRecipients = TypedDict("AwsSesBouncedRecipients", {"emailAddress": str})

AwsSesBounceObject = TypedDict(
    "AwsSesBounceObject",
    {
        "bounceType": str,
        "bounceSubType": str,
        "timestamp": str,
        "bouncedRecipients": list[AwsSesBouncedRecipients],
    },
)

AwsSesComplainedRecipients = TypedDict(
    "AwsSesComplainedRecipients", {"emailAddress": str}
)
AwsSesComplaintObject = TypedDict(
    "AwsSesComplaintObject",
    {
        "complaintSubType": str,
        "timestamp": str,
        "complainedRecipients": list[AwsSesComplainedRecipients],
    },
)


@receiver(bounce_received)
def bounce_handler(
    sender: Callable,
    mail_obj: AwsSesMailObject,
    bounce_obj: AwsSesBounceObject,
    raw_message: str,
    *args,
    **kwargs,
):
    for bounced_recipient in bounce_obj["bouncedRecipients"]:
        email_address = bounced_recipient["emailAddress"]
        deliveries, _ = EmailDeliveries.objects.get_or_create(email=email_address)
        deliveries.bounces += 1
        deliveries.last_bounce = bounce_obj["timestamp"]
        deliveries.save()


@receiver(complaint_received)
def complaint_handler(
    sender: Callable,
    mail_obj: AwsSesMailObject,
    complaint_obj: AwsSesComplaintObject,
    raw_message: str,
    *args,
    **kwargs,
):
    for complained_recipient in complaint_obj["complainedRecipients"]:
        email_address = complained_recipient["emailAddress"]
        deliveries, _ = EmailDeliveries.objects.get_or_create(email=email_address)
        deliveries.complaints += 1
        deliveries.save()
