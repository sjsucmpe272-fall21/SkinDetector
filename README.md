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

The number of casualties due to car accidents in the USA have been increasing as of late. In 2020 alone, the US saw more than 38000 cases of car accident related deaths, a 7% increase over the previous year. In order to find solutions for reducing the number of car crashes, it is important to analyze and detect the causes leading to this alarmingly high number of deaths. 

### Abstract

We propose to help fight the expontentially increasing tally of car-related deaths in the US by garnering insights on the reasons behind the accidents. Understanding the factors leading to a severe car crash is important to make decisions for preventing those crashes, such as awareness campaigns in the badly affected areas or increased law enforcement efforts. Our proposal involves a web application that can accurately predict the severity of a car accident given the conditions leading to it. 

### Approach

We first aim to leverage Machine Learning based approaches to perform analysis and predict the severity of an accident given the factors leading to the situation, such as the road, location and time of day. For this, we propose to create a Python (Flask) backend, which would be used to interact with the machine learning model that has been trained on a large dataset of recent car accidents. As the frontend library, we could use React.js to communicate with the Python (Flask) backend. Finally, we would deploy this application using a cloud service provider such as AWS or IBM Cloud.

### Persona

Public seeking awareness about car-related deaths, businesses looking to develop solutions to combat car accidents or law enforcement.

### Dataset

- https://www.kaggle.com/sobhanmoosavi/us-accidents
