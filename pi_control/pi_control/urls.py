"""pi_control URL Configuration"""

from django.conf import settings
from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.urls import include, path
from rest_framework import routers

from ff_ebook_frontend.views import BuildEbookView
from home import views as home_views

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
    path("admin/", admin.site.urls),
]

if settings.DEBUG:
    import debug_toolbar

    urlpatterns += [path("__debug__/", include(debug_toolbar.urls))]
