sudo apt-get update
sudo apt-get install python3-pip
sudo apt install nvidia-cuda-toolkit
pip3 install torch torchvision

#install conda
cd /tmp
curl -O https://repo.anaconda.com/archive/Anaconda3-5.2.0-Linux-x86_64.sh
bash Anaconda3-5.2.0-Linux-x86_64.sh
source ~/.bashrc

#insturcitons from mask rcnn
conda create --name maskrcnn_benchmark
source activate maskrcnn_benchmark
conda install ipython

git clone https://github.com/facebookresearch/maskrcnn-benchmark.git
cd maskrcnn-benchmark
pip install -r requirements.txt

cd ..
git clone https://github.com/pytorch/vision.git
cd vision
python setup.py install

cd ..
git clone https://github.com/cocodataset/cocoapi.git
cd cocoapi/PythonAPI
python setup.py build_ext install

cd ../../maskrcnn-benchmark
python setup.py build develop

conda install opencv
