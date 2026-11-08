from django.contrib.auth.decorators import login_required
from django.shortcuts import render


@login_required()
def home(request, *args, **kwargs):
    return render(request, "pi_control/home/home.html")
