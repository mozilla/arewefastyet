
        #include<stdio.h>
        struct vec {
          int x, y, z;
          int r, g, b;
          vec(int x_, int y_, int z_, int r_, int g_, int b_) : x(x_), y(y_), z(z_), r(r_), g(g_), b(b_) {}
          static vec add(vec a, vec b) {
            return vec(a.x+b.x, a.y+b.y, a.z+b.z, a.r+b.r, a.g+b.g, a.b+b.b);
          }
          void norm() {
            x %= 1024;
            y %= 1024;
            z %= 1024;
            r %= 1024;
            b %= 1024;
            g %= 1024;
          }
          int sum() { return x + y + z + r + g + b; }
        };
        int main(int argc, char **argv) {
          int arg = argc > 1 ? argv[1][0] - '0' : 3;
          switch(arg) {
            case 0: return 0; break;
            case 1: arg = 75; break;
            case 2: arg = 625; break;
            case 3: arg = 1250; break;
            case 4: arg = 5*1250; break;
            case 5: arg = 10*1250; break;
            default: printf("error: %d\\n", arg); return -1;
          }

          int total = 0;
          for (int i = 0; i < arg; i++) {
            for (int j = 0; j < 50000; j++) {
              vec c(i, i+i%10, j*2, i%255, j%120, i%15);
              vec d(j+i%10, j*2, j%255, i%120, j%15, j);
              vec e = c;
              c.norm();
              d.norm();
              vec f = vec::add(c, d);
              f = vec::add(e, f);
              f.norm();
              f = vec::add(d, f);
              total += f.sum() % 100;
              total %= 10240;
            }
          }
          printf("sum:%d\n", total);
          return 0;
        }
      