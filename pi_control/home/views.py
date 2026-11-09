from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie


@login_required()
@ensure_csrf_cookie
def home(request, *args, **kwargs):
    return render(request, "pi_control/home/home.html")
