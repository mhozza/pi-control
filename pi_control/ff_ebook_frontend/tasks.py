from celery import shared_task

from ff_ebook.ffnet import FindAdapter, Munger

FORMATS = ["mobi"]


@shared_task
def convert_ebook(url, email_from, email_to):
    adapter = FindAdapter(url)
    munger = Munger(
        url,
        adapter,
        formats=FORMATS,
        clean=True)
    munger.DownloadAndConvert()
