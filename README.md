# Team-Project-4

## Idea 1 - Skin Cancer Detector

### Introduction

One in five Americans will develop skin cancer in their lifetime, and nearly 10,000 people are diagnosed with skin cancer every day. According to the American Academy of Dermatology, skin cancer is the most common form of cancer in the United States. On the positive side, skin cancer is one of the most treatable cancers if detected and treated early.

### Abstract

We propose a web application where users can upload images of their moles or any skin patches that they fear may be cancerous. The web app will analyze the images and determine the probability of skin cancer. The web app should not be treated as professional medical advice, but as a tool to provide an early assessment or pre-screening of the user's situation. If the user suspects they may have skin cancer, they should seek professional medical help.

### Approach

The first step is to create a frontend for users to upload their images and for the web app to return the results. We have many frontend technologies to choose from, such as React or Angular. Next, we need to train a machine learning model to detect skin cancer from images. The two main machine learning technologies we could use are TensorFlow and PyTorch. The next step is to decide whether we want the machine learning model to be hosted on the frontend or backend. We can use TensorFlow.js to host the model directly in the browser, or we can use Flask to host the model on a Python backend and communicate with the frontend through REST APIs.

### Persona

Anyone who wishes to check a suspicious mole or skin patch for skin cancer.

### Datasets

- https://www.kaggle.com/datasets?search=skin+cancer
- https://www.kaggle.com/datasets?search=melanoma

## Idea 2 - US Car Accident Severity Prediction

### Introduction

The number of casualties due to car accidents in the USA have been increasing as of late. In 2020 alone, the US saw more than 38,000 cases of car accident related deaths, a 7% increase over the previous year. In order to find solutions for reducing the number of car crashes, it is important to analyze and detect the causes leading to this alarmingly high number of deaths.

### Abstract

We propose to help fight the expontentially increasing tally of car-related deaths in the US by garnering insights on the reasons behind the accidents. Understanding the factors leading to a severe car crash is important to make decisions for preventing those crashes, such as awareness campaigns in the badly affected areas or increased law enforcement efforts. Our proposal involves a web application that can accurately predict the severity of a car accident given the conditions leading to it.

### Approach

We first aim to leverage machine learning based approaches to perform analysis and predict the severity of an accident given the factors leading to the situation, such as the road, location and time of day. For this, we propose to create a Python (Flask) backend, which would be used to interact with the machine learning model that has been trained on a large dataset of recent car accidents. As the frontend library, we could use React to communicate with the Python (Flask) backend. Finally, we would deploy this application using a cloud service provider such as AWS or IBM Cloud.

### Persona

Public seeking awareness about car-related deaths, businesses looking to develop solutions to combat car accidents, or law enforcement.

### Datasets

- https://www.kaggle.com/sobhanmoosavi/us-accidents

## Idea 3 - Credit Card Management System

### Introduction

As we know, the credit card concept is a bit alien to the people who apply for it for the first time. Many people don't know how to order the credit card, usage of credit limits, and how to create credit score. Moreover, paying credit card bills before the statement generation is the most important task to avoid penalties. Our proposal involves a Credit Card Management System which help customers manage their credit cards.

### Abstract

Our Credit Card Management System can handle the entire lifecycle of a customer's credit card. It will help people gather relevant information about credit cards, add and verify credit cards, fetch the credit card statement to generate a summary and extract insights, make payments for the card, understand usage patterns, and earn reward points additional to the ones offered by the bank.

### Approach

We aim to implement the user interface in HTML, CSS, React and Bootstrap. We will allow the user to signup, login, add credit card, delete credit card, get the statement, and pay credit card bills. The backend functionalities will be implemented in Node.js, and MySQL will be used to store the user data, card data, and credit card history. We will be implementing the APIs to manage the user and card functionalities which will be tested through Postman and finally, this application will be hosted on Amazon Web Services.

### Persona

Consumers: Who will signup, login, add card, get credit card history, pay the bills on the Credit Card Management System.

### Datasets

- https://www.kaggle.com/arjunbhasin/credit-card-dataset

## Idea 4 - Crime Rate Analysis and Prediction in Buffalo, NY

### Introduction

Buffalo has a crime rate of 4.4%, which is one of the highest crime rates in America. According to the survey of NeighborhoodScout, 1 in 23 is the chance of being a victim of either violent or property crime. Within New York, more than 99% of the communities have a lower crime rate than Buffalo. In fact, Buffalo is included in one of the top 100 most dangerous cities in the U.S.A. It is useful to analyze and predict the possibility of crime and take precautions accordingly.

### Abstract

For particularly one city, Buffalo, we can analyze and predict the safety of a person using the dataset of crime incidents in the city of Buffalo. We can visualize the data using Python libraries like Seaborn for further usage in finding the safe areas in Buffalo city e.g. visualizations provided can be used by a suggestion panel of crime department to take precautionary actions like allocating resources (police, weapons, vehicles, etc.) according to crimewise hot zones.

### Approach

We can use HTML, CSS, and React for the frontend through which users can sign up, login, and surf the website. The rest can be done using Python. The provided dataset contains data according to different attributes such as date-time, type of crime, and zipcode of the area where it happened. After data pre-processing, we can make a variety of projections of crimes in according to the attributes. The prediction of crime at a particular spot in Buffalo can be done using predictive analysis algorithms such as classification and regression.

### Persona

Civilians, newcomers, and travellers to Buffalo can use this site to know the degree and type of threat in one particular area. In this way, users can keep in mind the safety measures.

### Datasets

- https://data.buffalony.gov/Public-Safety/Crime-Incidents-Data-Lens-/vhp3-62vz
