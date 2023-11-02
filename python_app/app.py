import boto3
import time
from jprint import jprint

# Initialize SQS client
sqs = boto3.client("sqs", region_name="us-east-1")

queue_url = "https://sqs.us-east-1.amazonaws.com/241413258911/jf-test-queue"

# Lets create the queue
sqs.create_queue(QueueName="jf-test-queue")

# Lets put a message into the queue
# response = sqs.send_message(
#     QueueUrl=queue_url,
#     DelaySeconds=0,
#     MessageAttributes={},
#     MessageBody="Hello World!",
# )

while True:
    try:
        # Receive a message from the queue (change MaxNumberOfMessages as needed)
        response = sqs.receive_message(
            QueueUrl=queue_url,
            AttributeNames=["All"],
            MaxNumberOfMessages=1,
            MessageAttributeNames=["All"],
            VisibilityTimeout=0,
            WaitTimeSeconds=0,
        )

        jprint(response)

        # Process the received message
        if "Messages" in response:
            message = response["Messages"][0]
            # Process the message here
            print("Received Message: ", message["Body"])

            # Delete the message from the queue
            receipt_handle = message["ReceiptHandle"]
            sqs.delete_message(QueueUrl=queue_url, ReceiptHandle=receipt_handle)
        else:
            print("No messages in queue")
        time.sleep(2)  # Sleep for 2 seconds before checking the queue again

    except Exception as e:
        print(f"An error occurred: {str(e)}")
        time.sleep(2)
