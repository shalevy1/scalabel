Instructions for testing GPU payload:
Create a clean AWS machine: ubuntu 18.04 g3s.xlarge; in step 4, increase size to 30
In the main folder, run setup_backend.sh on the machine (change sat to scalabel)
Inside the compute folder, run setup_payload.sh
scp over inference.py and test_image.png:
scp -i "chrispowrs.pem" test_image.png ubuntu@ec2-18-221-128-170.us-east-2.compute.amazonaws.com:~/scalabel/model/compute/maskrcnn-benchmark/demo
scp -i "inference.py" test_image.png ubuntu@ec2-18-221-128-170.us-east-2.compute.amazonaws.com:~/scalabel/model/comptuemaskrcnn-benchmark/demo
(incomplete)
