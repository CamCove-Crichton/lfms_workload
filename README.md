# LFMS Workload

The idea behind the LFMS Workload is to extract data from the rental management system that the company uses, by utilising the rental management systems API to access data. It is used to display the company workload at the present time in the form of a traffic light, and to have a rolling two week calendar display to also show the workload for each day coming up over the following two weeks with the idea to build on and develop further in the future.

---

## Features

- Data extraction from an external source using an API
- Traffic light display, which changes colour depending on the current workload which is calculated by weight
- Two week rolling calendar to display the colour for the workload for each day for the upcoming two weeks
- Event weights to be displayed for the indivdual events

---

## Deployment

*deployment steps go here*

---

## Forking & Cloning

*forking & cloning insturctions go here*

---

## Am I Responsive

*amiresponsive image goes here*

---

## Developments

- Began by creating a basic html structured file and added in some styling
- Added in the relative Bootstrap and Google links for use of styling and fall back fonts
- Uploaded custom company fonts
- To improve structure, security and scalability, I installed Django 5.0
- Upon django installation, I had to restructure the project and organize it to django file structure standard for clean code approach and scalability approach
- The created a base template for all other templates to extend from
- Added in a home app for the index file and anything quite generic that would fall into the home app realm
- Created the workload app for the main purpose of this project for the time being, where the views and templates will live for the workload functionality of the project
- Added in a view, url and template for the workload app
- Installed django-allauth and copied all the allauth templates into an accounts directory in the project level templates directory and made migrations as well as adjusted the setting file for the allauth package and added some config settings

---

## Future Developments

*future developments will go here*

---

## Wireframes

*wireframes will go here and any potential database designs*

---

## Technologies

- Django 5.0
- Bootstrap 5.3
- Django Allauth

---

## Finished Site Screen Grabs

*finished site/application screen grabs go here*

---

## Testing

### Manual & Automated Testing

*Manual & Automated Tests go here*

### Validator Testing

### Lighthouse Results

### Resolved Bugs

### Unresolved Bugs

---

## Credits

### COde Credits

### Other Credits

---

## Contributors