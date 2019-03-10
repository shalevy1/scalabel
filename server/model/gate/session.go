package main

import (
	"encoding/json"
	pb "../proto"
	"fmt"
	"github.com/gorilla/websocket"
	"golang.org/x/net/context"
	"log"
	"time"
)

const (
	pongWait   = 1800 * time.Second
	pingPeriod = (pongWait * 9) / 10
)

type Session struct {
	uuid         string
	client       *Client
	appName      string
	modelName    string
	modelVersion int
}

type WebRegisterMessage struct {
	SessionId string `json:"sessionId"`
	StartTime string `json:"startTime"`
}

type WebRegisterResponse struct {
	SessionId     string        `json:"sessionId"`
	EchoedMessage string        `json:"echoedMessage"`
	TimingData    TimingData    `json:"timingData"`
}

type WebMessage struct {
	Message          string `json:"message"`
	StartTime        string `json:"startTime"`
	TerminateSession string `json:"terminateSession"`
	MessageType      string `json:"messageType"`
}

type WebEchoResponse struct {
	EchoedMessage string     `json:"echoedMessage"`
	TimingData    TimingData `json:"timingData"`
}

type WebBboxResponse struct {
	BboxData   string     `json:"bboxData"`
	TimingData TimingData `json:"timingData"`
}

type TimingData struct {
	ModelServerTimestamp string `json:"modelServerTimestamp"`
	ModelServerDuration  string `json:"modelServerDuration"`
	GrpcDuration         string `json:"grpcDuration"`
	StartTime            string `json:"startTime"`
}


func startSession(hub *Hub, conn *websocket.Conn) {
	var msg WebRegisterMessage
	err := conn.ReadJSON(&msg)
	log.Printf("Got this message: %v at %s\n", msg, time.Now().String())

	if err != nil {
		log.Println("Register App ReadJSON Error", err)
		conn.Close()
	}

	var session *Session
	if existingSession, ok := hub.sessions[msg.SessionId]; ok {
		session = existingSession
	} else {
		echoedMessage, modelServerTimestamp, modelServerDuration, grpcDuration := hub.grpcRegistration(msg.SessionId)

		session = &Session{
			uuid: msg.SessionId,
			client: &Client{
				hub:  hub,
				conn: conn,
			},
		}

		hub.registerSession <- session
		timingData := TimingData{
			ModelServerTimestamp: modelServerTimestamp,
			ModelServerDuration:  modelServerDuration,
			GrpcDuration:         grpcDuration,
			StartTime:            msg.StartTime,
		}
		registrationResponse := WebRegisterResponse{
			SessionId:     session.uuid,
			TimingData:    timingData,
			EchoedMessage: echoedMessage,
		}
		session.client.conn.WriteJSON(&registrationResponse)
		go session.DataListener()
	}
}

//Call the Register remote procedure and get the timing data
func (hub *Hub) grpcRegistration(sessionId string) (string, string, string, string) {
	ctx, cancel := context.WithTimeout(context.Background(), 10 * time.Second)
	defer cancel()

	start := time.Now()
	response, err := hub.modelServer.Register(ctx, &pb.Session{Message: "register", SessionId: sessionId})
	end := time.Now()
	grpcDuration := fmt.Sprintf("%.3f", float64(end.Sub(start))/float64(time.Millisecond))

	if err != nil {
		log.Fatalf("could not register with gRPC: %v", err)
	}
	return response.Session.Message, response.ModelServerTimestamp, response.ModelServerDuration, grpcDuration
}

func (session *Session) DataListener() {
	defer func() {
		log.Println("Close DataListener.")
		session.client.conn.Close()
	}()

	for {
		var msg WebMessage
		err := session.client.conn.ReadJSON(&msg)
		log.Printf("Got this message: %v at %s\n", msg, time.Now().String())
		if err != nil {
			log.Println("Invalid message")
			session.client.hub.unregisterSession <- session
			break
		}

		if msg.TerminateSession == "true" {
			log.Println("Terminating go session")
			session.grpcKill()
			session.client.hub.unregisterSession <- session
			break
		}

		echoedMessage, bboxData, modelServerTimestamp, modelServerDuration, grpcDuration := session.grpcComputation(msg)

		timingData := TimingData{
			ModelServerTimestamp: modelServerTimestamp,
			ModelServerDuration:  modelServerDuration,
			GrpcDuration:         grpcDuration,
			StartTime:            msg.StartTime,
		}

		if msg.MessageType == "echo" {
			webResponse := WebEchoResponse{
				EchoedMessage: echoedMessage,
				TimingData:    timingData,
			}
			session.client.conn.WriteJSON(&webResponse)
		} else if msg.MessageType == "bbox" {
			webResponse := WebBboxResponse{
				BboxData:   bboxData,
				TimingData: timingData,
			}
			log.Printf("Made this web response: %v\n", webResponse)

			session.client.conn.WriteJSON(&webResponse)
		} else {
			log.Fatalf("invalid message type: %s", msg.MessageType)
		}

	}
}

//Call the specified remote procedure using the WebData, and get data for WebResponse
func (session *Session) grpcComputation(msg WebMessage) (string, string, string, string, string) {
	ctx, cancel := context.WithTimeout(context.Background(), 10 * time.Second)
	defer cancel()

	var response *pb.Response
	var bboxResponse *pb.BboxResponse
	var err error
	var echoedMessage string
	var bboxDataString string

	start := time.Now()
	if msg.MessageType == "echo" {
		response, err = session.client.hub.modelServer.DummyComputation(
			ctx, &pb.Session{Message: msg.Message, SessionId: session.uuid})
		echoedMessage = response.Session.Message
	} else if msg.MessageType == "bbox" {
		bboxResponse, err = session.client.hub.modelServer.ModelComputation(
			ctx, &pb.Session{Message: msg.Message, SessionId: session.uuid})
		response = bboxResponse.Response
		bboxData, err2 := json.Marshal(bboxResponse.Bboxes)
		bboxDataString = string(bboxData)
		if err2 != nil {
			log.Fatalf("could not parse grpc return value: %v", err2)
		}
	} else {
		log.Fatalf("invalid message type: %s", msg.MessageType)
	}
	end := time.Now()

	grpcDuration := fmt.Sprintf("%.3f", float64(end.Sub(start))/float64(time.Millisecond))
	if err != nil {
		log.Fatalf("could not echo from gRPC: %v", err)
	}

	return echoedMessage, bboxDataString, response.ModelServerTimestamp, response.ModelServerDuration, grpcDuration
}

//Kill the ray actor corresponding to the go session being killed
func (session *Session) grpcKill() {
	ctx, cancel := context.WithTimeout(context.Background(), 10 * time.Second)
	defer cancel()

	_, err := session.client.hub.modelServer.KillActor(
		ctx, &pb.Session{Message: "", SessionId: session.uuid})

	if err != nil {
		log.Fatalf("could not kill ray worker using grpc: %v", err)
	}
}
