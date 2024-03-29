//+------------------------------------------------------------------+
//|                                         Websocketclient_test.mq5 |
//|                        Copyright 2019, MetaQuotes Software Corp. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2019, MetaQuotes Software Corp."
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict
#include <Controls\WndContainer.mqh>
#import "user32.dll"
bool GetCursorPos(int &x);
#import
input int Timeout=5000;
#include<WebSocketClient.mqh>



//+------------------------------------------------------------------+
//|                                                                  |
//+------------------------------------------------------------------+

//---
CWebSocketClient wsc;
input string Address="127.0.0.1";
input int    Port   =7681;
input bool   ExtTLS =false;
input int    MaxSize=256;

//---
int sent=-1;
uint received=-1;
double lastOpen, lastHigh, lastLow, lastClose;
datetime lastTime;

double lastBid = 0;
double lastAsk = 0;
double bidMovement =0;
double porcentagemDelta = 0;
input int timeMiliSeconds = 30;
input double minDelta = 0;
input int ticks_to_track = 10; // Número de ticks a serem rastreados
input int points_multiplier = 10000; // Fator de multiplicação para obter pontos (4 casas decimais)
double deltaCalculado = 0;

//--- Declaração do array
double movements[];
double lastTick = 0;
int mouseX;
int mouseY;
datetime currentTime;



string infos[5] = {"Símbolo", "Tick", "Posição", "Mouse X", "Mouse Y"};
//---
// string subject,issuer,serial,thumbprint;
//---
// datetime expiration;
//---
//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
  {
//--- create timer

//ArrayResize(movements, 0); // Inicializar o array vazio
   EventSetMillisecondTimer(timeMiliSeconds);



   wsc.SetMaxSendSize(MaxSize);
//---
   if(wsc.Connect(Address,Port,Timeout,ExtTLS,true))
     {
      sent=wsc.SendString("Conectar-se");
      //--
      Print("sent data is "+IntegerToString(sent));
      //---
     }

//---
//wsc.SetMaxSendSize(MaxSize);
//---
//  if(wsc.Connect(Address,Port,Timeout,ExtTLS,true))
//    {
//    sent=wsc.SendString("Conectar-se");
//--
//    Print("sent data is "+IntegerToString(sent));
//---
//  }

   return(CreatePanel());


  }

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
  {
//--- destroy timer
   EventKillTimer();
   Print("Deinit call");
   wsc.Close();

   ObjectDelete(0, "Background");
   for(int i=0; i<ArraySize(infos); i++)
      ObjectDelete(0, infos[i]);
   for(int i=0; i<ArraySize(infos); i++)
      ObjectDelete(0, infos[i]+"Valor");

  }
//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
  {
//---


   double currentBid = SymbolInfoDouble(_Symbol, SYMBOL_BID);

   bidMovement = MathRound((currentBid - lastBid) / Point());
//
//  if(bidMovement > 0 || bidMovement < 0)
//lastBid = currentBid;
//Print(bidMovement);
//sent=wsc.SendString(bidMovement);


   UpdatePanel();









  }


//+------------------------------------------------------------------+
//|                                                                  |
//+------------------------------------------------------------------+
void OnTimer()
  {

   double currentBid = SymbolInfoDouble(_Symbol, SYMBOL_BID);

   bidMovement = MathRound((currentBid - lastBid) / Point());
//
   if(bidMovement > 0 || bidMovement < 0)
      lastBid = currentBid;

   //Print(bidMovement);

   if(bidMovement >= minDelta && bidMovement < 100)
     {
      sent=wsc.SendString("put/"+_Symbol);
     }

   if(bidMovement <= minDelta *-1 && bidMovement > -100)
     {
      sent=wsc.SendString("call/"+_Symbol);
     }
//sent=wsc.SendString(bidMovement);


   UpdatePanel();
  }


// Função de tratamento de evento personalizado

//+------------------------------------------------------------------+
//|                                                                  |
//+------------------------------------------------------------------+

// Função para criar o painel
int CreatePanel()
  {
   int delta_x = 10;
   int delta_y = 10;
   int x_size = 200;
   int line_size = 40;
   int y_size = line_size*ArraySize(infos)+10;

//--- Criar o painel

// Background
   if(!ObjectCreate(0, "Background", OBJ_RECTANGLE_LABEL, 0, 0, 0))
      return(INIT_FAILED);

   ObjectSetInteger(0, "Background", OBJPROP_CORNER, CORNER_LEFT_LOWER);
   ObjectSetInteger(0, "Background", OBJPROP_XDISTANCE, delta_x);
   ObjectSetInteger(0, "Background", OBJPROP_YDISTANCE, y_size + delta_y);
   ObjectSetInteger(0, "Background", OBJPROP_XSIZE, x_size);
   ObjectSetInteger(0, "Background", OBJPROP_YSIZE, y_size);

   ObjectSetInteger(0, "Background", OBJPROP_BGCOLOR, clrYellow);
   ObjectSetInteger(0, "Background", OBJPROP_BORDER_TYPE, BORDER_FLAT);
   ObjectSetInteger(0, "Background", OBJPROP_BORDER_COLOR, clrBlack);

// Criar campos
   for(int i=0; i<ArraySize(infos); i++)
     {
      if(!ObjectCreate(0, infos[i], OBJ_LABEL, 0, 0, 0))
         return(INIT_FAILED);

      ObjectSetInteger(0, infos[i], OBJPROP_ANCHOR, ANCHOR_LEFT_UPPER);
      ObjectSetInteger(0, infos[i], OBJPROP_CORNER, CORNER_LEFT_LOWER);
      ObjectSetInteger(0, infos[i], OBJPROP_XDISTANCE, delta_x + 5);
      ObjectSetInteger(0, infos[i], OBJPROP_YDISTANCE, delta_y - 5 + y_size - i*line_size);

      ObjectSetInteger(0, infos[i], OBJPROP_COLOR, clrBlack);
      ObjectSetInteger(0, infos[i], OBJPROP_FONTSIZE, 10);
      ObjectSetString(0, infos[i], OBJPROP_TEXT, infos[i]);
     }

// Iniciar valores
   for(int i=0; i<ArraySize(infos); i++)
     {
      string name = infos[i] + "Valor";
      if(!ObjectCreate(0, name, OBJ_LABEL, 0, 0, 0))
         return(INIT_FAILED);

      ObjectSetInteger(0, name, OBJPROP_ANCHOR, ANCHOR_RIGHT_UPPER);
      ObjectSetInteger(0, name, OBJPROP_CORNER, CORNER_LEFT_LOWER);
      ObjectSetInteger(0, name, OBJPROP_XDISTANCE, delta_x + x_size - 5);
      ObjectSetInteger(0, name, OBJPROP_YDISTANCE, delta_y - 5 + y_size - i*line_size);

      ObjectSetInteger(0, name, OBJPROP_COLOR, clrBlack);
      ObjectSetInteger(0, name, OBJPROP_FONTSIZE, 10);
      ObjectSetString(0, name, OBJPROP_TEXT, "-");
     }

   ChartRedraw();


   return(INIT_SUCCEEDED);
  }

// Função para definir as propriedades do painel
void SetPanelProperties(const int panelHandle)
  {
   ObjectSetInteger(0, "InfoPanel", OBJPROP_XDISTANCE, 10); // Distância horizontal do canto superior esquerdo
   ObjectSetInteger(0, "InfoPanel", OBJPROP_YDISTANCE, 10); // Distância vertical do canto superior esquerdo
   ObjectSetInteger(0, "InfoPanel", OBJPROP_COLOR, clrRed); // Cor do texto
   ObjectSetInteger(0, "InfoPanel", OBJPROP_BACK, clrWhite); // Cor de fundo do painel
   ObjectSetInteger(0, "InfoPanel", OBJPROP_ANCHOR, ANCHOR_LEFT_UPPER); // Alinhamento do texto
  }
// Função para atualizar o painel com as informações desejadas
void UpdatePanel()
  {
   string posicao = "Nenhuma";
   if(PositionSelect(_Symbol))
     {
      if(PositionGetInteger(POSITION_TYPE)==POSITION_TYPE_BUY)
         posicao = "Comprado";
      else
         posicao = "Vendido";
     }
   ObjectSetString(0, infos[0] + "Valor", OBJPROP_TEXT, _Symbol);
   ObjectSetString(0, infos[1] + "Valor", OBJPROP_TEXT,    bidMovement);
   ObjectSetString(0, infos[2] + "Valor", OBJPROP_TEXT, posicao);
   ObjectSetString(0, infos[3] + "Valor", OBJPROP_TEXT,    mouseX);
   ObjectSetString(0, infos[4] + "Valor", OBJPROP_TEXT, mouseY);
  }

//+------------------------------------------------------------------+
//|                                                                  |
//+------------------------------------------------------------------+

//+------------------------------------------------------------------+
//+------------------------------------------------------------------+

//+------------------------------------------------------------------+

//+------------------------------------------------------------------+
