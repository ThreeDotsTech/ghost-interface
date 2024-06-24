Function Initialize() Uint64
1	IF EXISTS("owner")==0 THEN GOTO 10
2	GOTO 666
10	STORE("owner",SIGNER())
20	STORE("feeTo",SIGNER())
30	STORE("nameHdr","Ghost Exchange")
40	STORE("descrHdr","Phantom-powered finance")
50	RETURN 0
666	RETURN 1
End Function
Function AddLiquidity(t String,u Uint64) Uint64    
1	DIM w2,r1,s1,t1,u1,v1,w1,x1 AS Uint64      
2	LET x1 = 18446744073709551
3	LET v1 = DEROVALUE()
4	LET w1 = ASSETVALUE(HEXDECODE(t))
10	IF (w1>0)&&(v1>0) THEN GOTO 30
20	GOTO 666
30	LET w2 = i(t)
40	IF w2>0 THEN GOTO 41 ELSE GOTO 60
41	IF u>0 THEN GOTO 43
42	GOTO 666
43	LET r1 = k(t)
44	LET s1 = m(t)
45	IF q(s1,w1)==1 THEN GOTO 666
46	g(r1,s1,t)
47	LET w2 = i(t)
48	LET t1 = r(v1,s1,r1+1)
49	LET u1 = r(v1,w2,r1)
50	IF ((w1>=t1)&&(u1>=u))&&((s1+w1)<=x1) THEN GOTO 52
51	GOTO 666
52	n(SIGNER(),u1,t)
53	h(w2+u1,t)
54	IF w1==t1 THEN GOTO 56
55	SEND_ASSET_TO_ADDRESS(SIGNER(),w1-t1,HEXDECODE(t))
56	j(r1+v1,t)
57	l(s1+t1,t)
58	STORE(t+":rootKLast",s(r1+v1)*s(s1+t1))
59	GOTO 70
60	IF (v1>=1000)&&(w1<=x1) THEN GOTO 62
61	GOTO 666
62	l(w1,t)
63	DIM y1 AS Uint64
64	LET y1 = v1
65	h(y1,t)
66	j(v1,t)
67	STORE(t+":rootKLast",s(w1)*s(v1))
68	n(SIGNER(),y1,t)
70	RETURN 0
666	RETURN 1
End Function
Function RemoveLiquidity(v Uint64,w Uint64,y2 Uint64,t String) Uint64
1	DIM w2,r1,s1,z1,t1 AS Uint64
10	IF ((v>0)&&((w>0)&&(y2>0)))&&(p(SIGNER(),t)>=v) THEN GOTO 30
20	GOTO 666
30	LET w2 = i(t)
40	IF w2>0 THEN GOTO 60
50	GOTO 666
60	LET s1 = m(t)
70	LET r1 = k(t)
80	g(r1,s1,t)
90	LET w2 = i(t)
100	LET z1 = r(v,r1,w2)
110	LET t1 = r(v,s1,w2)
120	IF (z1>=w)&&(t1>=y2) THEN GOTO 140
130	GOTO 666
140	o(SIGNER(),v,t)
150	h(w2-v,t)
160	j(r1-z1,t)
170	l(s1-t1,t)
180	STORE(t+":rootKLast",s(r1-z1)*s(s1-t1))
190	SEND_DERO_TO_ADDRESS(SIGNER(),z1)
200	SEND_ASSET_TO_ADDRESS(SIGNER(),t1,HEXDECODE(t))
210	RETURN 0
666	RETURN 1
End Function
Function l1(o1 Uint64,z2 Uint64,a1 Uint64) Uint64
1	DIM x1 AS Uint64
2	LET x1 = 18446744073709551
10	IF ((z2>0)&&(a1>0))&&(o1<=x1) THEN GOTO 30
20	PANIC
30	DIM b2 AS Uint64
40	LET b2 = o1*997
50	IF q(z2*1000,o1*1000)==0 THEN GOTO 70
60	PANIC
70	RETURN r(b2,a1,(z2*1000)+b2)
End Function
Function m1(b1 Uint64,z2 Uint64,a1 Uint64) Uint64
10	IF ((z2>0)&&(a1>0))&&(a1>b1) THEN GOTO 30
20	PANIC
30	RETURN r(z2*1000,b1,((a1-b1)*997)+1)
End Function
Function n1(c1 Uint64,y2 Uint64,t String) Uint64
10	IF (c1>0)&&(y2>0) THEN GOTO 30
20	PANIC
30	DIM d1,s1,r1 AS Uint64
40	LET s1 = m(t)
50	LET r1 = k(t)
60	LET d1 = l1(c1,r1,s1)
70	IF d1>=y2 THEN GOTO 90
80	PANIC
90	SEND_ASSET_TO_ADDRESS(SIGNER(),d1,HEXDECODE(t))
100	l(s1-d1,t)
110	j(r1+c1,t)
120	RETURN 0
End Function
Function DeroToAssetSwapInput(asset_address String) Uint64
10	RETURN n1(DEROVALUE(),1,asset_address)
End Function
Function DeroToAssetSwapInputMin(min_assets Uint64,asset_address String) Uint64
10	RETURN n1(DEROVALUE(),min_assets,asset_address)
End Function
Function d(d1 Uint64,e1 Uint64,t String) Uint64
10	IF (d1>0)&&(e1>0) THEN GOTO 30
20	PANIC
30	DIM s1,r1,c1,c2 AS Uint64
40	LET s1 = m(t)
41	LET r1 = k(t)
50	LET c1 = m1(d1,r1,s1)
60	IF c1>e1 THEN GOTO 61 ELSE GOTO 70
61	PANIC
70	LET c2 = e1-c1
80	IF c2==0 THEN GOTO 100
90	SEND_DERO_TO_ADDRESS(SIGNER(),c2)
100	SEND_ASSET_TO_ADDRESS(SIGNER(),d1,HEXDECODE(t))
110	l(s1-d1,t)
120	j(r1+c1,t)
130	RETURN 0
End Function
Function DeroToAssetSwapOutput(assets_bought Uint64,asset_address String) Uint64
10	RETURN d(assets_bought,DEROVALUE(),asset_address)
End Function
Function e(f1 Uint64,w Uint64,t String) Uint64
10	IF (f1>0)&&(w>0) THEN GOTO 30
20	PANIC
30	DIM s1,g1 AS Uint64
40	LET s1 = m(t)
50	LET g1 = l1(f1,s1,k(t))
60	IF g1>=w THEN GOTO 80
70	PANIC
80	SEND_DERO_TO_ADDRESS(SIGNER(),g1)
90	j(k(t)-g1,t)
100	l(s1+f1,t)
110	RETURN 0
End Function
Function AssetToDeroSwapInput(min_dero Uint64,asset_address String) Uint64
10	RETURN e(ASSETVALUE(HEXDECODE(asset_address)),min_dero,asset_address)
End Function
Function f(g1 Uint64,h1 Uint64,t String) Uint64
10	IF g1>0 THEN GOTO 30
20	PANIC
30	DIM s1,f1,d2 AS Uint64
40	LET s1 = m(t)
50	LET f1 = m1(g1,s1,k(t))
60	IF h1>=f1 THEN GOTO 80
70	PANIC
80	SEND_DERO_TO_ADDRESS(SIGNER(),g1)
90	LET d2 = h1-f1
100	IF d2==0 THEN GOTO 120
110	SEND_ASSET_TO_ADDRESS(SIGNER(),d2,HEXDECODE(t))
120	j(k(t)-g1,t)
130	l(s1+f1,t)
140	RETURN 0
End Function
Function AssetToDeroSwapOutput(dero_bought Uint64,asset_address String) Uint64
10	RETURN f(dero_bought,ASSETVALUE(HEXDECODE(asset_address)),asset_address)
End Function
Function GetDeroToAssetInputPrice(c1 Uint64,t String) Uint64
10	IF c1>0 THEN GOTO 30
20	RETURN 0
30	RETURN l1(c1,k(t),m(t))
End Function
Function GetDeroToAssetOutputPrice(d1 Uint64,t String) Uint64
10	IF d1>0 THEN GOTO 30
20	RETURN 0
30	RETURN m1(d1,k(t),m(t))
End Function
Function GetAssetToDeroInputPrice(f1 Uint64,t String) Uint64
10	IF f1>0 THEN GOTO 30
20	RETURN 0
30	RETURN l1(f1,m(t),k(t))
End Function
Function GetAssetToDeroOutputPrice(g1 Uint64,t String) Uint64
10	IF g1>0 THEN GOTO 30
20	RETURN 0
30	RETURN m1(g1,m(t),k(t))
End Function
Function g(i1 Uint64,j1 Uint64,t String) Uint64
10	DIM e2 AS String
11	DIM f2 AS Uint64
20	LET e2 = LOAD("feeTo")
30	LET f2 = LOAD(t+":rootKLast")
40	IF f2!=0 THEN GOTO 50
41	RETURN 0
50	DIM g2 AS Uint64
60	LET g2 = s(i1)*s(j1)
70	IF g2>f2 THEN GOTO 80
71	RETURN 0
80	DIM h2,u1 AS Uint64
90	LET h2 = i(t)
100	LET u1 = r(h2,g2-f2,(g2*5)+f2)
110	IF u1>0 THEN GOTO 111 ELSE GOTO 120
111	n(e2,u1,t)
112	h(h2+u1,t)
120	RETURN 0
End Function
Function h(v Uint64,t String) Uint64
10      STORE(t+":BOO",v)
20      RETURN 0
End Function
Function i(t String) Uint64
10	IF EXISTS(t+":BOO") THEN GOTO 30
20	RETURN 0
30	RETURN LOAD(t+":BOO")
End Function
Function j(v Uint64,t String) Uint64
10	STORE(t+":DERO",v)
20	RETURN 0
End Function
Function k(t String) Uint64
10	RETURN LOAD(t+":DERO")
End Function
Function l(v Uint64,t String) Uint64
10	STORE(t,v)
20	RETURN 0
End Function
Function m(t String) Uint64
20	RETURN LOAD(t)
End Function
Function n(k1 String,v Uint64,t String) Uint64
10	IF EXISTS((ADDRESS_STRING(k1)+":BOO:")+t) THEN GOTO 40
20	STORE((ADDRESS_STRING(k1)+":BOO:")+t,v)
30	RETURN 0
40	STORE((ADDRESS_STRING(k1)+":BOO:")+t,p(k1,t)+v)
50	RETURN 0
End Function
Function o(k1 String,v Uint64,t String) Uint64
10	STORE((ADDRESS_STRING(k1)+":BOO:")+t,p(k1,t)-v)
20	RETURN 0
End Function
Function p(k1 String,t String) Uint64
10	RETURN LOAD((ADDRESS_STRING(k1)+":BOO:")+t)
End Function
Function q(l1 Uint64,m1 Uint64) Uint64
10	IF l1>(18446744073709551615-m1) THEN GOTO 100
20	RETURN 0
100	RETURN 1
End Function
Function r(l1 Uint64,m1 Uint64,n1 Uint64) Uint64
10 	DIM i2,j2 AS Uint64
20 	LET i2 = 4294967296
30 	LET j2 = ((i2-1)*i2)+(i2-1)
50 	DIM k2 AS Uint64
60 	LET k2 = ((l1/n1)*m1)+((l1%n1)*(m1/n1))
70 	LET l1 = l1%n1
80 	LET m1 = m1%n1
90 	IF (l1==0)||(m1==0) THEN GOTO 1000
100	IF n1>=i2 THEN GOTO 200
110	LET k2 = k2+((l1*m1)/n1)
120	GOTO 1000
200	DIM l2 AS Uint64
210	LET l2 = j2/n1
220	LET n1 = n1*l2
230	LET l1 = l1*l2
300	DIM m2,n2,o2,u3,q2,r2 AS Uint64
310	LET m2 = l1/i2
320	LET n2 = l1%i2
330	LET o2 = m1/i2
340	LET u3 = m1%i2
350	LET q2 = n1/i2
360	LET r2 = n1%i2
400	DIM s2,t2,u2 AS Uint64
410	LET s2 = n2*u3
420	LET t2 = (s2/i2)+(n2*o2)
430	LET s2 = s2%i2
440	LET u2 = (t2/i2)+(m2*o2)
450	LET t2 = (t2%i2)+(m2*u3)
460	LET u2 = u2+(t2/i2)
470	LET t2 = t2%i2
500	DIM v2,w2,x2 AS Uint64
510	LET u2 = u2%n1
520	LET w2 = u2/q2
530	LET x2 = u2%q2
600	IF (w2<i2)&&((x2>=i2)||((w2*r2)<=((x2*i2)+t2))) THEN GOTO 700
610	LET w2 = w2-1
620	LET x2 = x2+q2
630	GOTO 600
700	LET t2 = (((u2%i2)*i2)+t2)-(w2*r2)
710	LET u2 = (((u2/i2)*i2)+(t2/i2))-(w2*q2)
720	LET t2 = (t2%i2)+((u2%i2)*i2)
730	LET v2 = t2/q2
740	LET x2 = t2%q2
800	IF (v2<i2)&&((x2>=i2)||((v2*r2)<=((x2*i2)+s2))) THEN GOTO 900
810	LET v2 = v2-1
820	LET x2 = x2+q2
830	GOTO 800
900	LET k2 = (k2+v2)+(w2*i2)
1000	RETURN k2
End Function
Function s(o1 Uint64) Uint64
10 	IF o1>3 THEN GOTO 20 ELSE GOTO 90
20 	DIM y2,z2 AS Uint64
30 	LET z2 = o1
40 	LET y2 = (o1/2)+1
50 	IF y2<z2 THEN GOTO 60 ELSE GOTO 130
60 	LET z2 = y2
70 	LET y2 = ((o1/y2)+y2)/2
80 	GOTO 50
90 	IF o1!=0 THEN GOTO 110 ELSE GOTO 120
110	RETURN 1
120	RETURN 0
130	RETURN z2
End Function
Function UpdateCode(t2 String) Uint64
10	IF LOAD("owner")==SIGNER() THEN GOTO 30
20	RETURN 1
30	UPDATE_SC_CODE(t2)
40	RETURN 0
End Function