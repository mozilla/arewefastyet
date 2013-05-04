
        #include<stdio.h>
        #include<string.h>
        #include<stdlib.h>
        int main(int argc, char **argv) {
          int N, M;
          int arg = argc > 1 ? argv[1][0] - '0' : 3;
          switch(arg) {
            case 0: return 0; break;
            case 1: N = 1024*1024; M = 55; break;
            case 2: N = 1024*1024; M = 400; break;
            case 3: N = 1024*1024; M = 800; break;
            case 4: N = 1024*1024; M = 4000; break;
            case 5: N = 1024*1024; M = 8000; break;
            default: printf("error: %d\n", arg); return -1;
          }

          int final = 0;
          char *buf = (char*)malloc(N);
          for (int t = 0; t < M; t++) {
            for (int i = 0; i < N; i++)
              buf[i] = (i + final)%256;
            for (int i = 0; i < N; i++)
              final += buf[i] & 1;
            final = final % 1000;
          }
          printf("final: %d.\n", final);
          return 0;
        }
      
