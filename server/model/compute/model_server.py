from concurrent import futures
import datetime
import grpc
import model_server_pb2 as pb2
import model_server_pb2_grpc as pb2_grpc
import time
import ray
import logging
import argparse
import requests
import cv2
from io import BytesIO
logging.basicConfig(level=logging.INFO)
from PIL import Image

#these will crash unless on GPU machine
from maskrcnn_benchmark.config import cfg
from maskrcnn-benchmark/demo/predictor import COCODemo

@ray.remote(num_cpus=1)
class SessionWorker():
    def __init__(self, sessionId):
        self.sessionId = sessionId
        config_file = "maskrcnn-benchmark/configs/caffe2/e2e_mask_rcnn_R_50_FPN_1x_caffe2.yaml"

        # update the config options with the config file
        cfg.merge_from_file(config_file)
        # manual override some options
        cfg.merge_from_list(["MODEL.DEVICE", "cpu"])

        self.coco_demo = COCODemo(
            cfg,
            min_image_size=800,
            confidence_threshold=0.7,
        )

    def do_work(self):
        return str(datetime.datetime.now())

    def get_bboxes(self, url):
        response = requests.get(url)
        bytes = BytesIO(response.content)
        pil_img = Image.open(bytes)
        opencv_img = cv2.cvtColor(numpy.array(pil_img), cv2.COLOR_RGB2BGR)

        overlay, bboxes = self.coco_demo.run_on_opencv_image(opencv_img)

        formatted_bboxes = [pb2.Bbox(x=bbox[0], y=bbox[1], h=bbox[2] -bbox[0], w=bbox[3]-bbox[1]) for bbox in bboxes]
        box1 = pb2.Bbox(x=600, y=100, h=100, w=100)
        box2 = pb2.Bbox(x=100, y=300, h=100, w=100)
        return formatted_bboxes

class ModelServer(pb2_grpc.ModelServerServicer):
    def __init__(self):
        super().__init__()
        self.sessionIdsToWorkers = {}

    def Register(self, request, context):
        start = time.time()
        if request.sessionId not in self.sessionIdsToWorkers:
            newWorker = SessionWorker.remote(request.sessionId)
            self.sessionIdsToWorkers[request.sessionId] = newWorker
        timestamp = str(datetime.datetime.now())
        end = time.time()
        duration = "{0:.3f}".format((end - start) * 1000.0)
        return pb2.Response(session=request,
                            modelServerTimestamp=timestamp,
                            modelServerDuration=duration)

    def DummyComputation(self, request, context):
        start = time.time()
        id = request.sessionId
        worker = self.sessionIdsToWorkers[id]
        timestamp = ray.get(worker.do_work.remote())
        logging.info(f'Got this message {request} at {timestamp}')
        end = time.time()
        duration = "{0:.3f}".format((end - start) * 1000.0)
        return pb2.Response(session=request,
                            modelServerTimestamp=timestamp,
                            modelServerDuration=duration)

    def ModelComputation(self, request, context):
        start = time.time()
        id = request.sessionId
        url = request.message

        worker = self.sessionIdsToWorkers[id]
        bboxes = ray.get(worker.get_bboxes.remote(url))
        timestamp = ray.get(worker.do_work.remote())
        end = time.time()
        duration = "{0:.3f}".format((end - start) * 1000.0)
        baseResponse = pb2.Response(session=request,
                                    modelServerTimestamp=timestamp,
                                    modelServerDuration=duration)
        fullResponse = pb2.BboxResponse(response=baseResponse)
        fullResponse.bboxes.extend(bboxes)
        return fullResponse

    def KillActor(self, request, context):
        id = request.sessionId
        worker = self.sessionIdsToWorkers.pop(id, None)
        if worker:
            del worker
            logging.info(f'deleted worker for id {id}')
        else:
            loggin.info(f'attempted to delete worker for id {id}'
                        + ' but none exists')
        return pb2.Empty()


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=100))
    pb2_grpc.add_ModelServerServicer_to_server(ModelServer(), server)
    server.add_insecure_port('[::]:50051')
    server.start()
    print("Started ray server")
    try:
        while True:
            time.sleep(300000)
    except KeyboardInterrupt:
        server.stop(0)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', dest='local', action='store_true')
    parser.set_defaults(local=False)
    args = parser.parse_args()
    if args.local:
        ray.init(num_cpus=100, ignore_reinit_error=True)
    else:
        ray.init(redis_address="localhost:6379")

    serve()
