# Use an official Python runtime as the base image
FROM python:3.12

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install the project dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the project files into the container
COPY . .

# Run the commands to generate embeddings and build the graph
CMD ["sh", "-c", "python generate_embeddings.py && python build_graph.py && python attendees.py"]