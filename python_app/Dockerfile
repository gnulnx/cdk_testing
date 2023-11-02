# Use the official Python image
FROM python:3.9

# Set the working directory in the container
WORKDIR /app

# Copy the Python script into the container
COPY app.py /app/
COPY requirements.txt /app/

# Install the required Python packages
RUN pip install -r requirements.txt

# Run your Python script
CMD ["python", "app.py"]
