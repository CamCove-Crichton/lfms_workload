# LFMS Workload

The idea behind the LFMS Workload is to extract data from the rental management system that the company uses, by utilising the rental management systems API to access data. It is used to display the company workload at the present time in the form of a traffic light, and to have a rolling two week calendar display to also show the workload for each day coming up over the following two weeks with the idea to build on and develop further in the future.

---

## Features

- Data extraction from an external source using an API
- Traffic light display, which changes colour depending on the current workload which is calculated by weight
- Two week rolling calendar to display the colour for the workload for each day for the upcoming two weeks
- Event weights to be displayed for the indivdual events

---

## Configuration

### Environment Variables

Before running the application, you need to setup the following environment variables:

- 'API_URL': The URL of the API endpoint
- 'X_SUBDOMAIN': The subdomain for the authentication
- 'X_AUTH_TOKEN': The authentication token for accessing the API

You can use the following placeholders as defaults:

```bash
{
    export API_URL=https://example.com/api/v1/your_endpoint/
    export X_SUBDOMAIN=your_subdomain
    export X_AUTH_TOKEN=your_auth_token
}
```

---

## Deployment

- Created an app in Heroku, and added all the required config vars and the required buildpacks
- Connected to the Heroku app via the CLI
- Installed gunicorn to serve the application on Heroku
- Created a Procfile to instruct Heroku on how run the application
- Linked the Heroku app with the Github repo
- Did not migrate any databases, as the application currently is not utilising any databases
- Deployed to Heroku

---

## Forking, Cloning & Running the Application

- From this repository click the 'Fork' button to fork a copy of the repo to your repositories
- Use `git clone https://github.com/yourusername/yourproject.git` in your machine's terminal
- Use `cd yourproject` to change to your projects directory on your machine within your machine's terminal
- In your terminal setup a virtual environment using `python -m venv venv` and activate using `source venv/bin/activate`
- Install the dependencies using `pip install -r requirements.txt`
- Apply migrations using `python manage.py migrate`
- Run the development server using `python manage.py runserver`

You can now access the application at http://locahost:8000

**Remember to replace the placeholder values with your actual configuration when deploying the application in a production environment**

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
- Updated the django-allauth templates for a more custom display in line with the sites styling
- Then updated the styling a bit more on the traffic light display, and will come back to it once receiving data with the use of the Current RMS api
- Updated the workload views file to separate the api request to the api call function, to return the data in json format, and kept the view to return the template very simple
- Created a workload JavaScript file to handle the api call using a fetch request which calls to the backend api call
- Added in a JS function to handle the traffic light colour change
- Lookup an inspirational quote API to utilise in the project, to display inspirational/famous quotes in the template
- Created a function to assign the weight values to specific html elements to display the weights in a human readable format in the template
- Within the event listener function, I then call the above JS functions, and then utilise the setInterval web api call, to then have the same JS functions being called repeatedly at specific intervals

---

## Future Developments

- Will look to expand on the project as a whole, and add a vehicles or transport module

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

### Code Credits

[@A973 - Codepen](https://codepen.io/A973C) - Traffic light css

```css
{
    .trafficlight{
    background: #222;
    background-image: linear-gradient(transparent 2%, #111 2%, transparent 3%, #111 30%);
    width: 170px;
    height: 400px;
    border-radius: 20px;
    position: relative;
    border: solid 5px #333;
  }
  
  .red{
    background: red;
    background-image: radial-gradient(brown, transparent);
    background-size: 5px 5px; 
    width: 100px;
    height: 100px;
    border-radius: 50%;
    position: absolute;
    top: 20px;
    left: 35px;
    border: dotted 2px red;
    box-shadow: 
      0 0 20px #111 inset,
      0 0 10px red;
  }
  
  .yellow{
    background: yellow;
    background-image: radial-gradient(orange, transparent);
    background-size: 5px 5px;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border: dotted 2px yellow;
    position: absolute;
    top: 145px;
    left: 35px;
    box-shadow: 
      0 0 20px #111 inset,
      0 0 10px yellow;
  }
  
  .green{
    background: green;
    background-image: radial-gradient(lime, transparent);
    background-size: 5px 5px;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border: dotted 2px lime;
    position: absolute;
    top: 270px;
    left: 35px;
    box-shadow: 
      0 0 20px #111 inset,
      0 0 10px lime;
  }

  @keyframes fade-in{
    100%{opacity: 1}
    80%{opacity: 1}
    60%{opacity: 1}
    40%{opacity: .1}
    20%{opacity: .1}
    0%{opacity: .1}
  }

  @keyframes fade-out{
    0%{opacity: 1}
    20%{opacity: 1}
    40%{opacity: 1}
    60%{opacity: .1}
    80%{opacity: .1}
    100%{opacity: .1}
  }
}
```

### Other Credits

[Random Quotes API](https://github.com/lukePeavey/quotable) - Random Quote Genertor API used from lukePeavey/quoatable on Github

---

## Contributors
