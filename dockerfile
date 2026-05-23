# containerizing the python backend 

# getting the python 3.10 image from docker hub 
FROM python:3.10-slim 

# setting the working directory
WORKDIR /app/backend

# copying requirements.txt file 
COPY backend/requirements.txt .

# running the installation of the requirements 
RUN pip install --no-cache-dir -r requirements.txt

# copy the rest of the application code 
COPY backend/ .

# expose port for the FastAPI application
EXPOSE 8001

# running the application with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
