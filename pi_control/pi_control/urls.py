"""pi_control URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.urls import include, path
from rest_framework import routers

from ff_ebook_frontend.views import BuildEbookView
from home import views as home_views
from scrabbler_frontend.views import ScrabblerView

router = routers.DefaultRouter()


urlpatterns = [
    path("", home_views.home, name="home"),
    path("login/", auth_views.LoginView.as_view(), name="login"),
    path("logout/", auth_views.LogoutView.as_view(), name="logout"),
    path("oauth/", include("social_django.urls", namespace="social")),
    path("api/network/", include("network.urls")),
    path("api/pc_status/", include("pc_status.urls")),
    path("api/server_stats/", include("server_stats.urls")),
    path("api/temperature/", include("temperature.urls")),
    path("api/", include(router.urls)),
    path("ebook/", BuildEbookView.as_view(), name="build-ebook"),
    path("scrabble/", ScrabblerView.as_view(), name="scrabbler"),
    path("admin/", admin.site.urls),
]

if settings.DEBUG:
    import debug_toolbar

    urlpatterns += [path("__debug__/", include(debug_toolbar.urls))]
