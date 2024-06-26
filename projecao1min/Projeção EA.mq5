//+------------------------------------------------------------------+
//|                                                     MyScript.mq5 |
//|                        Copyright 2024, MetaQuotes Software Corp. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property indicator_chart_window
#include <Arrays\ArrayString.mqh>
#define FIB_OBJ "Fibonacci Retracement"
// Definição das constantes
input int nPeriod = 200; // Número de velas a serem analisadas
input int arrowSize = 40; // Tamanho das setas no gráfico
input color InpColor=clrBlack;
#include <Controls\WndContainer.mqh>
#include<WebSocketClient.mqh>
input int Timeout=5000;

int maxSequenceLength = 0;

datetime firstArrowTimeg, lastArrowTimeg, firstArrowTimer, lastArrowTimer;
int lastarrowindexg = 0;
int firstArrowindexg = 0;
int lastarrowindexr = 0;
int firstArrowindexr = 0;
double maxVariacaoGreen = 0;
double maxVariacaoRed = 0;

CWebSocketClient wsc;
input int projecao=140;
input string Address="127.0.0.1";
input int    Port   =7681;
input bool   ExtTLS =false;
input int    MaxSize=256;
input int timeMiliSeconds = 300;
input string horaNoticia  = "";
input string horaNoticia1  = "";
input string horaNoticia2  = "";

int minutePlus = 5;
int minuteMinus = 1;


datetime lastTime = NULL;

//---
int sent=-1;
uint received=-1;

//+------------------------------------------------------------------+
//|                                                                  |
//+------------------------------------------------------------------+
void OnTick(void)
  {

   if(lastTime == NULL)
     {
      lastTime = iTime(Symbol(),Period(),0);
     }

   if(lastTime != iTime(Symbol(),Period(),0))
     {
      refreshFibo();
      lastTime = iTime(Symbol(),Period(),0);

      ChartRedraw();

     }

   oncalculate();



  }

//+------------------------------------------------------------------+
//|                                                                  |
//+------------------------------------------------------------------+
int OnInit()
  {
//
   oncalculate();
   refreshFibo();

   fezaentrada = false;
//
   v = 0;
   c = 0;

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


   return(INIT_SUCCEEDED);
  }

//+------------------------------------------------------------------+
//|                                                                  |
//+------------------------------------------------------------------+
void refreshFibo()
  {
   maxVariacaoGreen = 0;
   maxVariacaoRed = 0;
   firstArrowTimer = NULL;
   lastArrowTimer =NULL;
   firstArrowindexr = 0;
   lastarrowindexr = 0;
   firstArrowTimeg = 0;
   lastArrowTimeg = NULL;
   firstArrowindexg = 0;
   lastarrowindexg = 0;


   for(int i = nPeriod - 1; i >= iStartMov; i--)
     {
      // Obter a cor da vela (bullish ou bearish)
      bool isBullish = iClose(Symbol(),Period(),i)> iOpen(Symbol(),Period(),i);
      bool isRed = iClose(Symbol(),Period(),i)< iOpen(Symbol(),Period(),i);

      datetime timeCandle = iTime(Symbol(),Period(),i);

      int hoursToSubtract = 6;
      int secondsToSubtract = (hoursToSubtract * 60 * 60);

      datetime minuteNow = timeCandle - secondsToSubtract;

      if(!isStopedNoticiaFunc(horaNoticia, minuteNow) && !isStopedNoticiaFunc(horaNoticia1, minuteNow) && !isStopedNoticiaFunc(horaNoticia2, minuteNow))
        {
         if(isBullish)
           {

            int sequenceLength = 1;
            for(int j = i - 1; j >= iStartMov; j--)
              {
               bool isBullishNext = iClose(Symbol(),Period(),j) > iOpen(Symbol(),Period(),j);
               if(isBullishNext == isBullish)
                 {

                  double high = iHigh(Symbol(),Period(),j) > iHigh(Symbol(),Period(),j-1) ? iHigh(Symbol(),Period(),j) : iHigh(Symbol(),Period(),j-1);
                  double low = iLow(Symbol(),Period(),i) < iLow(Symbol(),Period(),i+1) ? iLow(Symbol(),Period(),i) : iLow(Symbol(),Period(),i +1);

                  int jj = iHigh(Symbol(),Period(),j) > iHigh(Symbol(),Period(),j-1) ? j : j -1;
                  int ii = iLow(Symbol(),Period(),i) < iLow(Symbol(),Period(),i+1) ? i : i +1;

                  double variacao = high - low;


                  if(variacao > maxVariacaoGreen)
                    {
                     maxVariacaoGreen = variacao;
                     firstArrowTimeg = iTime(Symbol(),Period(),ii);
                     lastArrowTimeg = iTime(Symbol(),Period(),jj);
                     firstArrowindexg = ii;
                     lastarrowindexg = jj;
                    }
                 }
               else
                  break;
              }
           }
         else
            if(isRed)
              {

               int sequenceLength = 1;
               for(int j = i - 1; j >= iStartMov; j--)
                 {
                  bool isBullishNext = iClose(Symbol(),Period(),j) < iOpen(Symbol(),Period(),j);
                  if(isBullishNext)
                    {

                     double high = iHigh(Symbol(),Period(),i) > iHigh(Symbol(),Period(),i+1) ? iHigh(Symbol(),Period(),i) : iHigh(Symbol(),Period(),i+1);
                     double low = iLow(Symbol(),Period(),j) < iLow(Symbol(),Period(),j-1) ? iLow(Symbol(),Period(),j) : iLow(Symbol(),Period(),j -1);

                     int ii = iHigh(Symbol(),Period(),i) > iHigh(Symbol(),Period(),i+1) ? i : i +1;
                     int jj = iLow(Symbol(),Period(),j) < iLow(Symbol(),Period(),j-1) ? j : j -1;

                     double variacao = high - low;


                     if(variacao > maxVariacaoRed)
                       {
                        maxVariacaoRed = variacao;
                        firstArrowTimer = iTime(Symbol(),Period(),ii);
                        lastArrowTimer = iTime(Symbol(),Period(),jj);
                        firstArrowindexr = ii;
                        lastarrowindexr = jj;
                       }
                    }
                  else
                     break;
                 }
              }
        }
     }
//Print("refreshFibo");
  }

//+------------------------------------------------------------------+
//|                                                                  |
//+------------------------------------------------------------------+

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
  {
// Remover setas do gráfico ao desinicializar
   ObjectDelete(0, "FirstArrow");
   ObjectDelete(0, "LastArrow");
   ObjectDelete(0, "FirstArrow1");
   ObjectDelete(0, "LastArrow1");
   ObjectDelete(0, OBJ_EXPANSION + n);

   wsc.Close();
  }

//+------------------------------------------------------------------+
//|                                                                  |
//+------------------------------------------------------------------+
bool isStopedNoticiaFunc(string horaNoticiap, datetime minuteNow)
  {

   if(horaNoticiap != NULL && horaNoticiap != "")
     {

      int hoursToSubtract = 6;
      int secondsToSubtract = (hoursToSubtract * 60 * 60);
      datetime horaNoticiaDate = StringToTime(horaNoticia);

      horaNoticiaDate = horaNoticiaDate- secondsToSubtract;

      datetime horaNoticiaDateMinus5 = horaNoticiaDate - (minuteMinus * 60);

      datetime horaNoticiaDatePlus10 = horaNoticiaDate + (minutePlus * 60);

      Print(horaNoticiaDateMinus5);
      Print(horaNoticiaDatePlus10);
      Print(horaNoticiaDate);
      Print(horaNoticiap);


      return horaNoticiaDateMinus5 <= minuteNow && minuteNow <= horaNoticiaDatePlus10;

     }
   return false;
  }


bool fezaentrada = false;
bool createarrows = false;
bool createretractionfibo = false;
string corEntrada = "";
int n = 0;
int iStartMov = 10;
int v = 0;
int c = 0;
void oncalculate()
  {

   bool isGreenAtual = iClose(Symbol(),Period(),0) > iOpen(Symbol(),Period(),0);
   bool isRedAtual = iClose(Symbol(),Period(),0) < iOpen(Symbol(),Period(),0);

   string colorSequencia = "";

   datetime dataInicioSequencia = NULL;
   double minimaSequencia = 9999;
   double maximaSequencia = 0;




   for(int i = 0; i < nPeriod; i++)
     {
      if(colorSequencia == "")
        {
         if(iClose(Symbol(),Period(),i) < iOpen(Symbol(),Period(),i))
           {
            colorSequencia = "red";
           }

         if(iClose(Symbol(),Period(),i) > iOpen(Symbol(),Period(),i))
           {
            colorSequencia = "green";
           }
         continue;
        }
      if(colorSequencia == "")
        {
         break;
        }


      string corAtual = "";
      if(colorSequencia != "")
        {
         if(iClose(Symbol(),Period(),i) < iOpen(Symbol(),Period(),i))
           {
            corAtual = "red";
           }

         if(iClose(Symbol(),Period(),i) > iOpen(Symbol(),Period(),i))
           {
            corAtual = "green";
           }
        }
      //Print(corAtual, colorSequencia);

      if(colorSequencia == corAtual)
        {
         if(colorSequencia == "green")
           {
            if(iLow(Symbol(),Period(),i) < minimaSequencia)
              {
               minimaSequencia = iLow(Symbol(),Period(),i);
               dataInicioSequencia = iTime(Symbol(),Period(),i);
               iStartMov = i;
               if(iLow(Symbol(),Period(),i + 1) < minimaSequencia)
                 {
                  minimaSequencia = iLow(Symbol(),Period(),i + 1);
                  dataInicioSequencia = iTime(Symbol(),Period(),i + 1);
                  iStartMov = i + 1;
                 }
              }
           }
         else
            if(colorSequencia == "red")
              {
               if(iHigh(Symbol(),Period(),i) > maximaSequencia)
                 {
                  maximaSequencia = iHigh(Symbol(),Period(),i);
                  dataInicioSequencia = iTime(Symbol(),Period(),i);
                  iStartMov = i;
                  if(iHigh(Symbol(),Period(),i + 1) > maximaSequencia)
                    {
                     maximaSequencia = iHigh(Symbol(),Period(),i + 1);
                     dataInicioSequencia = iTime(Symbol(),Period(),i + 1);
                     iStartMov = i + 1;
                    }
                 }
              }
        }
      else
        {
         //print(i);
         if(i == 1)
           {
            colorSequencia = "";
            //fezaentrada = false;
           }

         break;
        }
     }

//print(colorSequencia);
//print(maximaSequencia);
//print(minimaSequencia);
//print(dataInicioSequencia);

   string corPenultimaVela = "";

   if(iClose(Symbol(),Period(),1) < iOpen(Symbol(),Period(),1))
     {
      corPenultimaVela = "red";
     }
   else
      if(iClose(Symbol(),Period(),1) > iOpen(Symbol(),Period(),1))
        {
         corPenultimaVela = "green";
        }
      else
        {
         corPenultimaVela = "doji";
        }

   if(fezaentrada && corEntrada == "green" && corPenultimaVela == "red")
     {
      fezaentrada = false;
      corEntrada = "";

     }
   else
      if(fezaentrada && corEntrada == "red" && corPenultimaVela == "green")
        {
         fezaentrada = false;
         corEntrada = "";
        }




   if((colorSequencia == "green" || colorSequencia == "red") && dataInicioSequencia != NULL)
     {

      if(!createarrows)
        {
         ObjectCreate(0, "FirstArrow", OBJ_ARROW, 0, firstArrowTimeg, iLow(Symbol(),Period(),firstArrowindexg) - arrowSize * _Point);
         ObjectSetInteger(0, "FirstArrow", OBJPROP_ARROWCODE, 241);
         ObjectCreate(0, "LastArrow", OBJ_ARROW, 0, lastArrowTimeg, iHigh(Symbol(),Period(),lastarrowindexg) + arrowSize * _Point);
         ObjectSetInteger(0, "LastArrow", OBJPROP_ARROWCODE, 242);

         ObjectCreate(0, "FirstArrow1", OBJ_ARROW, 0, firstArrowTimer, iHigh(Symbol(),Period(),firstArrowindexr) + arrowSize * _Point);
         ObjectSetInteger(0, "FirstArrow1", OBJPROP_ARROWCODE, 242);
         ObjectCreate(0, "LastArrow1", OBJ_ARROW, 0, lastArrowTimer, iLow(Symbol(),Period(),lastarrowindexr) - arrowSize * _Point);
         ObjectSetInteger(0, "LastArrow1", OBJPROP_ARROWCODE, 241);
        }
      else
        {

        }




      double entradag = iLow(Symbol(),Period(),iStartMov) + (maxVariacaoGreen + (maxVariacaoGreen * 0.4));
      double entradar = iHigh(Symbol(),Period(),iStartMov) - (maxVariacaoRed + (maxVariacaoRed * 0.4));

      if(projecao == 100)
        {
         entradag = iLow(Symbol(),Period(),iStartMov) + (maxVariacaoGreen);
         entradar = iHigh(Symbol(),Period(),iStartMov) - (maxVariacaoRed);
         //print(entrada);
        }

      double entrada100g = iLow(Symbol(),Period(),iStartMov) + (maxVariacaoGreen);
      double entrada100r = iHigh(Symbol(),Period(),iStartMov) - (maxVariacaoRed);

      double close = iClose(Symbol(),Period(),0);

      datetime currentCandleTime = iTime(Symbol(), Period(), 0);

      // Subtrair 5 horas (em segundos)
      int hoursToSubtract = 6;
      int secondsToSubtract = (hoursToSubtract * 60 * 60);

      datetime minuteNow = currentCandleTime - secondsToSubtract;

      if(colorSequencia == "green")
        {

       
            //ObjectCreate(0,OBJ_EXPANSION + n,OBJ_EXPANSION,0,firstArrowTimeg,iLow(Symbol(),Period(),firstArrowindexg),lastArrowTimeg,iHigh(Symbol(),Period(),lastarrowindexg),
            //             dataInicioSequencia,minimaSequencia);
            string linhac = "linhaV" + v;

            if(!fezaentrada)
              {

               ObjectCreate(_Symbol,linhac,OBJ_TREND,0,currentCandleTime - 60,entradag,currentCandleTime,entradag);

               ObjectSetInteger(0,linhac,OBJPROP_COLOR,clrDarkViolet);
              }
     
         if(close >= entradag && !fezaentrada && !isStopedNoticiaFunc(horaNoticia, minuteNow) && !isStopedNoticiaFunc(horaNoticia1, minuteNow) && !isStopedNoticiaFunc(horaNoticia2, minuteNow))
           {
            sent=wsc.SendString("put/"+_Symbol);
            Print("put/"+_Symbol);
            fezaentrada = true;
            corEntrada = "green";
            v++;
           }

        }
      else
        {

       
            // ObjectCreate(0,OBJ_EXPANSION + n,OBJ_EXPANSION,0,firstArrowTimer,iHigh(Symbol(),Period(),firstArrowindexr),lastArrowTimer,iLow(Symbol(),Period(),lastarrowindexr),
            //              dataInicioSequencia,maximaSequencia);
            string linhac = "linhaC" + c;

            if(!fezaentrada)
              {
               ObjectCreate(_Symbol,linhac,OBJ_TREND,0,currentCandleTime - 60,entradar,currentCandleTime,entradar);
               ObjectSetInteger(0,linhac,OBJPROP_COLOR,clrDarkViolet);
              }

           
         if(close <= entradar && !fezaentrada && !isStopedNoticiaFunc(horaNoticia, minuteNow) && !isStopedNoticiaFunc(horaNoticia1, minuteNow) && !isStopedNoticiaFunc(horaNoticia2, minuteNow))
           {
            sent=wsc.SendString("call/"+_Symbol);
            Print("call/"+_Symbol);
            fezaentrada = true;
            corEntrada = "red";
            c++;
           }

        }
      Comment(entradag, " = ", entradar, " fezaentrada=", fezaentrada, " iStartMov=", iStartMov, " isStopedNoticiaFunc=", isStopedNoticiaFunc(horaNoticia, minuteNow) || isStopedNoticiaFunc(horaNoticia1, minuteNow) || isStopedNoticiaFunc(horaNoticia2, minuteNow));
      /*ObjectSetInteger(0,OBJ_EXPANSION + n,OBJPROP_RAY_RIGHT,1);

      ObjectSetInteger(0,OBJ_EXPANSION + n,OBJPROP_COLOR,InpColor);
      ObjectSetInteger(0,OBJ_EXPANSION + n,OBJPROP_LEVELCOLOR,0,InpColor);
      ObjectSetInteger(0,OBJ_EXPANSION + n,OBJPROP_LEVELCOLOR,1,InpColor);
      ObjectSetInteger(0,OBJ_EXPANSION + n,OBJPROP_LEVELCOLOR,2,InpColor);
      ObjectSetInteger(0,OBJ_EXPANSION + n,OBJPROP_LEVELCOLOR,3,InpColor);
      ObjectSetInteger(0,OBJ_EXPANSION + n,OBJPROP_STYLE,STYLE_SOLID);

      ObjectSetInteger(0,OBJ_EXPANSION + n,OBJPROP_LEVELS,4);

      ObjectSetDouble(0,OBJ_EXPANSION + n,OBJPROP_LEVELVALUE,0,1);
      ObjectSetDouble(0,OBJ_EXPANSION + n,OBJPROP_LEVELVALUE,1,1.618);
      ObjectSetDouble(0,OBJ_EXPANSION + n,OBJPROP_LEVELVALUE,2,1.4);
      ObjectSetDouble(0,OBJ_EXPANSION + n,OBJPROP_LEVELVALUE,3,2);

      ObjectSetString(0,OBJ_EXPANSION + n,OBJPROP_LEVELTEXT,0,"");
      ObjectSetString(0,OBJ_EXPANSION + n,OBJPROP_LEVELTEXT,1,"Saida");
      ObjectSetString(0,OBJ_EXPANSION + n,OBJPROP_LEVELTEXT,2,"Entrada");
      ObjectSetString(0,OBJ_EXPANSION + n,OBJPROP_LEVELTEXT,3,"Extremo");

      ObjectSetInteger(0,OBJ_EXPANSION + n,OBJPROP_LEVELSTYLE,0,STYLE_SOLID);
      ObjectSetInteger(0,OBJ_EXPANSION + n,OBJPROP_LEVELSTYLE,1,STYLE_SOLID);
      ObjectSetInteger(0,OBJ_EXPANSION + n,OBJPROP_LEVELSTYLE,2,STYLE_SOLID);
      ObjectSetInteger(0,OBJ_EXPANSION + n,OBJPROP_LEVELSTYLE,3,STYLE_SOLID);

      ObjectSetInteger(0,OBJ_EXPANSION + n,OBJPROP_WIDTH,1);



      ObjectSetInteger(0,OBJ_EXPANSION + n,OBJPROP_BACK,0);*/

     }
   else
     {
      ObjectDelete(0, OBJ_EXPANSION + n);
      ObjectDelete(0, "FirstArrow");
      ObjectDelete(0, "LastArrow");
      ObjectDelete(0, "FirstArrow1");
      ObjectDelete(0, "LastArrow1");
      //ObjectDelete(0, "linhaC");
      //ObjectDelete(0, "linhaV");
      createarrows = false;
      createretractionfibo = false;
      n++;
      if(n > 99999)
        {
         n = 0;
        }
     }
  }


//+------------------------------------------------------------------+
