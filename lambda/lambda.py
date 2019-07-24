import json
import os
import subprocess
import boto3
from shutil import copytree

access_key = os.environ['access_key']
secret_key = os.environ['secret_key']
region = 'us-east-2'


def init_client(service):
    """
    initialize boto3 client and return it
    """
    session = boto3.Session(aws_access_key_id=access_key,
                            aws_secret_access_key=secret_key,
                            region_name=region)
    client = session.client(service)
    return client


def copy_ffmpeg():
    src_folder = '/opt/'
    dst_folder = '/tmp/ffmpeg/'
    copytree(src_folder, dst_folder)
    dst_files = os.listdir(dst_folder)
    print(dst_files)
    for f in dst_files:
        os.chmod(f'{dst_folder}{f}', 0o777)


def delete_q_message(receiptHandle, sqs):
    message = {
        'QueueUrl': 'https://sqs.us-east-2.amazonaws.com/708652431203/2019govcondemo',
        'ReceiptHandle': receiptHandle,
    }
    sqs.delete_message(**message)
    

def lambda_handler(event, context):
    eventSource = event['Records'][0].get('eventSource', 'none')
    s3 = init_client('s3')
    sqs = init_client('sqs')

    if eventSource == 'aws:sqs':
        receiptHandle = event['Records'][0]['receiptHandle']
        if not os.path.exists('/tmp/ffmpeg/ffmpeg'):
            copy_ffmpeg()
        print('SQS Queue Grabbed')
        # item was posted to SQS
        # get file name and resolution from SQS
        body = event['Records'][0]['body']
        full_file_name, resolution = body.split('$')
        file_name = full_file_name.split('/')[1]
        # build new file name
        no_extension, extension = file_name.split('.')
        new_file_name = f'{no_extension}[{resolution}].{extension}'
        new_file_path = f'/tmp/{new_file_name}'
        key_name = f'transcodes/{resolution}/{new_file_name}'

        if '480' in resolution:
            scale = '-vf scale=640:480,setdar=4:3'
        else:
            scale = '-vf scale=1280:720'
        tmp = '/tmp/'
        # download file from s3
        bucket_name = '2019govcondemo'
        s3.download_file(bucket_name, full_file_name, f'{tmp}{file_name}')
        command = f"/tmp/ffmpeg/ffmpeg -i /tmp/{file_name} {scale} {new_file_path}"
        subprocess.call(command, shell=True)
        if os.path.exists(new_file_path):
            s3.upload_file(new_file_path, bucket_name, key_name)
            delete_q_message(receiptHandle, sqs)
            return {
                'statusCode': 200,
                'body': json.dumps(f'S3 Upload of {new_file_name} SUCCESS!')
            }
        else:
            delete_q_message(receiptHandle, sqs)
            return {
                'statusCode': 400,
                'body': json.dumps(f'S3 Upload of {new_file_name} FAILED!')
            }
    elif eventSource == 'aws:s3':
        print('S3 Uploaded')
        # Item was uploaded to S3
        # transcode options
        transcodes = ['720p', '480p']
        # get file name
        file_name = event['Records'][0]['s3']['object']['key']
        file_name = file_name.replace('+', ' ')
        # build messages for SQS
        SQS_messages = []
        for resolution in transcodes:
            SQS_message = f'{file_name}${resolution}'
            SQS_messages.append(SQS_message)

        # send messages to SQS
        for message in SQS_messages:
            print(f'Uploading {message} to SQS')
            message = {
                'QueueUrl': 'https://sqs.us-east-2.amazonaws.com/708652431203/2019govcondemo',
                'MessageBody': message,
            }
            sqs.send_message(**message)

        return {
            'statusCode': 200,
            'body': json.dumps('S3 Event')
        }
    else:
        return {
            'statusCode': 200,
            'body': json.dumps('Hello from Lambda!')
        }
