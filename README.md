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
