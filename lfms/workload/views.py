from django.shortcuts import render

def workload(request):
    """
    A view to display the current workload and upcoming
    workload using in the form of a traffic light system
    """
    template = 'workload/workload.html'
    # context = {}

    return render(request, template)
