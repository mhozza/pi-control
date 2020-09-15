from django.contrib import admin


class CustomAdminSite(admin.AdminSite):
    site_header = "Pi Control administration"

    def get_urls(self):
        default_urls = super().get_urls()
        return default_urls
