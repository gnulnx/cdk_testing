import boto3
import time
import logging

# Make sure logging to console works
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

while True:
    logger.info("Hello World!")
    time.sleep(2)

# while True:
#     try:
#         sqs = boto3.client("sqs", region_name="us-east-1")

#         queue_url = "https://sqs.us-east-1.amazonaws.com/241413258911/jf-test-queue"

#         # Lets create the queue
#         sqs.create_queue(QueueName="jf-test-queue")

#         # Receive a message from the queue (change MaxNumberOfMessages as needed)
#         response = sqs.receive_message(
#             QueueUrl=queue_url,
#             AttributeNames=["All"],
#             MaxNumberOfMessages=1,
#             MessageAttributeNames=["All"],
#             VisibilityTimeout=0,
#             WaitTimeSeconds=0,
#         )

#         logger.info(response)
#         print(response)

#         # Process the received message
#         if "Messages" in response:
#             message = response["Messages"][0]
#             # Process the message here
#             print("Received Message: ", message["Body"])

#             # Delete the message from the queue
#             receipt_handle = message["ReceiptHandle"]
#             sqs.delete_message(QueueUrl=queue_url, ReceiptHandle=receipt_handle)
#         else:
#             print("No messages in queue")
#         time.sleep(2)  # Sleep for 2 seconds before checking the queue again

#     except Exception as e:
#         print(f"An error occurred: {str(e)}")
#         logger.info(f"An error occurred: {str(e)}")
#         time.sleep(2)
