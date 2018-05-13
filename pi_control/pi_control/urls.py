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
from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.urls import include, path
from rest_framework import routers

from home import views as home_views
from temperature import views as temperature_views
from pc_status import views as pc_status_views

router = routers.DefaultRouter()

urlpatterns = [
    path('', home_views.home, name='home'),
    path('login/', auth_views.login, name='login'),
    path('logout/', auth_views.logout, name='logout'),
    path('oauth/', include('social_django.urls', namespace='social')),
    path('api/temperature', temperature_views.get_temperature_and_humidity, name='get_temperature_and_humidity'),
    path('api/pc_status', pc_status_views.get_pc_status, name='get_temperature_and_humidity'),
    path('api/', include(router.urls)),
    path('admin/', admin.site.urls),
]
