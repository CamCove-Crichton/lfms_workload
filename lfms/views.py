from django.shortcuts import render


def handler404(request, exception):
    """404 error handler. Return a rendered 404.html template."""
    return render(request, 'errors/404.html', status=404)


def handler500(request):
    """500 error handler. Return a rendered 500.html template."""
    return render(request, 'errors/500.html', status=500)


def handler403(request, exception):
    """403 error handler. Return a rendered 403.html template."""
    return render(request, 'errors/403.html', status=403)
