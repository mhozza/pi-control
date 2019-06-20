import tempfile

from celery import shared_task
from django.core.mail import EmailMessage
from slugify import slugify

from ff_ebook.ffnet import FindAdapter, Munger

FORMATS = ["mobi"]


@shared_task
def convert_ebook(url, email_from, email_to):
    fname = tempfile.mktemp(prefix="ebook")
    adapter = FindAdapter(url)
    munger = Munger(url, adapter, formats=FORMATS, clean=True, filename=fname)
    story = munger.DownloadStory()
    munger.CreateEbook(story)
    output_filename = "{}.mobi".format(fname)

    # Send email
    fname_for_email = "{}_{}.mobi".format(slugify(story.author), slugify(story.title))
    message = EmailMessage(
        subject=story.title,
        body="{} by {}".format(story.title, story.author),
        from_email=email_from,
        to=[email_to],
    )
    with open(output_filename, "rb") as f:
        content = f.read()
        message.attach(fname_for_email, content, "application/x-mobipocket-ebook")
    message.send(fail_silently=False)

    return (output_filename,)
