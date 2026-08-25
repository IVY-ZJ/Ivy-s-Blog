# 常微分方程

---

## 一、初等积分法

> 核心思想：将微分方程化为积分问题。针对不同类型的方程，使用对应的变量替换或积分技巧。

### 1.1 可分离变量方程

$$
\frac{dy}{dx} = f(x)\,g(y)
$$

**方法**：分离变量后两端积分

$$
\frac{dy}{g(y)} = f(x)\,dx \quad \Longrightarrow \quad \int \frac{dy}{g(y)} = \int f(x)\,dx + C
$$

!!! note "注意"
    若存在 $y^*$ 使得 $g(y^*) = 0$，则 $y \equiv y^*$ 也是一个解，不要遗漏。

---

### 1.2 齐次方程

$$
\frac{dy}{dx} = \varphi\!\left(\frac{y}{x}\right)
$$

**方法**：令 $u = \dfrac{y}{x}$，即 $y = ux$，则 $\dfrac{dy}{dx} = x\dfrac{du}{dx} + u$，代入得

$$
x\frac{du}{dx} = \varphi(u) - u
$$

回到可分离变量的情形。解出 $u(x)$ 后回代 $y = ux$。

!!! note "三种情况"
    - $\varphi(u) - u \neq 0$：正常分离变量积分
    - 存在 $u_0$ 使得 $\varphi(u_0) - u_0 = 0$：$u = u_0$（即 $y = u_0 x$）也是解
    - $\varphi(u) - u \equiv 0$：原方程退化为 $\dfrac{dy}{dx} = \dfrac{y}{x}$

---

### 1.3 一阶线性方程

$$
\frac{dy}{dx} + p(x)\,y = f(x)
$$

#### 方法一：积分因子法

乘以积分因子 $\mu(x) = e^{\int p(x)\,dx}$，左端凑成导数：

$$
\left[y \cdot e^{\int p(x)\,dx}\right]' = f(x)\,e^{\int p(x)\,dx}
$$

两端积分：

$$
y = e^{-\int p(x)\,dx}\left[\int f(x)\,e^{\int p(x)\,dx}\,dx + C\right]
$$

#### 方法二：常数变易法

1. 先解齐次方程 $y' + p(x)y = 0$，得 $y = C\,e^{-\int p(x)\,dx}$
2. 将常数 $C$ 变易为函数 $C(x)$，代入非齐次方程
3. 解出 $C'(x) = f(x)\,e^{\int p(x)\,dx}$，积分得 $C(x)$

#### 初值问题

若 $y\big|_{x=x_0} = y_0$，则

$$
y = e^{-\int_{x_0}^{x} p(\xi)\,d\xi}\left[\int_{x_0}^{x} f(\zeta)\,e^{\int_{x_0}^{\zeta} p(\xi)\,d\xi}\,d\zeta + y_0\right]
$$

---

### 1.4 伯努利方程

$$
\frac{dy}{dx} + p(x)\,y = f(x)\,y^n, \qquad n \neq 0,\;1
$$

**方法**：两端同除以 $y^n$

$$
y^{-n}\frac{dy}{dx} + p(x)\,y^{1-n} = f(x)
$$

令 $z = y^{1-n}$，则 $\dfrac{dz}{dx} = (1-n)\,y^{-n}\dfrac{dy}{dx}$，代入得

$$
\frac{dz}{dx} + (1-n)\,p(x)\,z = (1-n)\,f(x)
$$

这是一个关于 $z$ 的一阶线性方程，求出 $z$ 后回代 $y = z^{\frac{1}{1-n}}$。

!!! note "注意"
    当 $n > 0$ 时，$y \equiv 0$ 显然也是一个解。

---

### 1.5 全微分方程

$$
M(x,y)\,dx + N(x,y)\,dy = 0
$$

**判定条件**：$\dfrac{\partial M}{\partial y} = \dfrac{\partial N}{\partial x}$

若满足，则左端是某函数 $u(x,y)$ 的全微分：$du = M\,dx + N\,dy$，通解为 $u(x,y) = C$。

#### 求 $u(x,y)$ 的三种方法

**方法一：路径积分法**（利用与路径无关性）

$$
u(x,y) = \int_{x_0}^{x} M(x, y_0)\,dx + \int_{y_0}^{y} N(x, y)\,dy \quad \text{（先右再上）}
$$

$$
u(x,y) = \int_{y_0}^{y} N(x_0, y)\,dy + \int_{x_0}^{x} M(x, y)\,dx \quad \text{（先上再右）}
$$

**方法二：偏积分法**

先把 $y$ 看作常量，对 $x$ 积分：

$$
u(x,y) = \int M(x,y)\,dx + \varphi(y)
$$

然后对 $y$ 求偏导，令 $\dfrac{\partial u}{\partial y} = N(x,y)$，解出 $\varphi'(y)$，积分得 $\varphi(y)$。

**方法三：分项组合法**

常见全微分公式：

$$
y\,dx + x\,dy = d(xy)
$$

$$
\frac{y\,dx - x\,dy}{y^2} = d\!\left(\frac{x}{y}\right)
$$

$$
\frac{-y\,dx + x\,dy}{x^2} = d\!\left(\frac{y}{x}\right)
$$

$$
\frac{-y\,dx + x\,dy}{x^2 + y^2} = d\!\left(\arctan\frac{y}{x}\right)
$$

$$
\frac{y\,dx - x\,dy}{x^2 - y^2} = d\!\left(\frac{1}{2}\ln\left|\frac{x-y}{x+y}\right|\right)
$$

#### 积分因子

若 $\dfrac{\partial M}{\partial y} \neq \dfrac{\partial N}{\partial x}$，需要求积分因子 $\mu$：

- 若 $\dfrac{\frac{\partial M}{\partial y} - \frac{\partial N}{\partial x}}{N} \equiv \varphi(x)$，则 $\mu(x) = e^{\int \varphi(x)\,dx}$
- 若 $\dfrac{\frac{\partial M}{\partial y} - \frac{\partial N}{\partial x}}{-M} \equiv \psi(y)$，则 $\mu(y) = e^{\int \psi(y)\,dy}$

---

### 1.6 例题

#### 例 1：可分离变量

求解 $\dfrac{dy}{dx} = \dfrac{1+y^2}{xy}$

**解**：分离变量

$$
\frac{y\,dy}{1+y^2} = \frac{dx}{x}
$$

积分：$\dfrac{1}{2}\ln(1+y^2) = \ln|x| + C_1$

即 $1+y^2 = Cx^2$（$C > 0$）

---

#### 例 2：齐次方程

求解 $\dfrac{dy}{dx} = \dfrac{y}{x} + \tan\dfrac{y}{x}$

**解**：令 $u = \dfrac{y}{x}$，$y = ux$，$\dfrac{dy}{dx} = x\dfrac{du}{dx} + u$

$$
x\frac{du}{dx} + u = u + \tan u \quad \Longrightarrow \quad x\frac{du}{dx} = \tan u
$$

分离变量：$\cot u\,du = \dfrac{dx}{x}$

积分：$\ln|\sin u| = \ln|x| + C_1$

$$
\sin\frac{y}{x} = Cx
$$

---

#### 例 3：一阶线性方程

求解 $y' + \dfrac{y}{x} = x^2$

**解**：积分因子 $\mu = e^{\int \frac{1}{x}\,dx} = x$

$$
(xy)' = x^3 \quad \Longrightarrow \quad xy = \frac{x^4}{4} + C
$$

$$
y = \frac{x^3}{4} + \frac{C}{x}
$$

---

#### 例 4：伯努利方程

求解 $y' + y = y^2 e^x$

**解**：$n=2$，两端除以 $y^2$：$y^{-2}y' + y^{-1} = e^x$

令 $z = y^{-1}$，$z' = -y^{-2}y'$

$$
-z' + z = e^x \quad \Longrightarrow \quad z' - z = -e^x
$$

积分因子 $\mu = e^{-x}$：

$$
(ze^{-x})' = -1 \quad \Longrightarrow \quad ze^{-x} = -x + C
$$

$$
z = (C-x)e^x \quad \Longrightarrow \quad y = \frac{1}{(C-x)e^x}
$$

---

#### 例 5：全微分方程

求解 $(2xy + 3x^2)\,dx + (x^2 + 2y)\,dy = 0$

**解**：$M = 2xy + 3x^2$，$N = x^2 + 2y$

验证：$\dfrac{\partial M}{\partial y} = 2x = \dfrac{\partial N}{\partial x}$，是全微分方程。

$$
u = \int_0^x (3x^2)\,dx + \int_0^y (x^2 + 2y)\,dy = x^3 + x^2 y + y^2
$$

通解：$x^3 + x^2 y + y^2 = C$

---

## 二、二阶与高阶微分方程

### 2.1 可降阶方程

#### 类型 A：不含 $y$ 和 $y'$

$$
y'' = f(x)
$$

连续积分两次即可。注意每次积分产生的常数项。

#### 类型 B：不含 $y$

$$
y'' = f\!\left(x,\;\frac{dy}{dx}\right)
$$

令 $p = \dfrac{dy}{dx}$，则 $y'' = \dfrac{dp}{dx}$，代入得

$$
\frac{dp}{dx} = f(x, p)
$$

这是关于 $p$ 的一阶方程，求出 $p(x)$ 后再积分：$y = \int p(x)\,dx + C_2$。

#### 类型 C：不含 $x$

$$
y'' = f\!\left(y,\;\frac{dy}{dx}\right)
$$

令 $p = \dfrac{dy}{dx}$，视 $p$ 为 $y$ 的函数，则

$$
y'' = \frac{dp}{dx} = \frac{dp}{dy}\cdot\frac{dy}{dx} = p\,\frac{dp}{dy}
$$

代入得 $p\,\dfrac{dp}{dy} = f(y, p)$，化为关于 $p$ 和 $y$ 的一阶方程。

---

### 2.2 常系数线性齐次方程

$$
y'' + p\,y' + q\,y = 0 \qquad (p,\,q \text{ 为常数})
$$

**特征方程**：$\lambda^2 + p\lambda + q = 0$

| 特征根 | 通解 |
|:------|:-----|
| 两个不等实根 $\lambda_1 \neq \lambda_2$ | $y = C_1 e^{\lambda_1 x} + C_2 e^{\lambda_2 x}$ |
| 重根 $\lambda_1 = \lambda_2 = \lambda$ | $y = (C_1 + C_2 x)\,e^{\lambda x}$ |
| 共轭复根 $\lambda = \alpha \pm \beta i$ | $y = e^{\alpha x}(C_1\cos\beta x + C_2\sin\beta x)$ |

---

### 2.3 常系数线性非齐次方程

$$
y'' + p\,y' + q\,y = f(x)
$$

**通解结构**：$y = Y + y^*$，其中 $Y$ 是对应齐次方程的通解，$y^*$ 是非齐次方程的一个特解。

#### 情形一：$f(x) = P_m(x)\,e^{\alpha x}$

设特解 $y^* = x^k\,R_m(x)\,e^{\alpha x}$，其中 $R_m(x)$ 是 $m$ 次待定多项式，$k$ 的取值：

- $k = 0$：$\alpha$ 不是特征根
- $k = 1$：$\alpha$ 是单特征根
- $k = 2$：$\alpha$ 是重特征根

#### 情形二：$f(x) = P_m(x)\,e^{ax}\cos bx$ 或 $Q_m(x)\,e^{ax}\sin bx$（或其线性组合）

设特解 $y^* = x^k\left[R_m(x)\,e^{ax}\cos bx + S_m(x)\,e^{ax}\sin bx\right]$，$k$ 的取值：

- $k = 0$：$a \pm bi$ 不是特征根
- $k = 1$：$a \pm bi$ 是特征根

---

### 2.4 欧拉方程

$$
a_0 x^2 y'' + a_1 x y' + a_2 y = f(x)
$$

**方法**：令 $x = e^t$（$x > 0$），则

$$
x\,y' = \frac{dy}{dt}, \qquad x^2\,y'' = \frac{d^2 y}{dt^2} - \frac{dy}{dt}
$$

代入得常系数方程：

$$
a_0\left(\frac{d^2 y}{dt^2} - \frac{dy}{dt}\right) + a_1\frac{dy}{dt} + a_2 y = f(e^t)
$$

$$
a_0\frac{d^2 y}{dt^2} + (a_1 - a_0)\frac{dy}{dt} + a_2 y = f(e^t)
$$

---

### 2.5 变系数线性方程

#### 已知一个非零解 $y_1$

利用 **Liouville 公式**（降阶法）：

$$
y = y_1\left[C_1 + C_2\int \frac{1}{y_1^2}\,e^{-\int p(x)\,dx}\,dx\right]
$$

#### 变动任意常数法（非齐次）

设齐次通解 $Y = C_1 y_1(x) + C_2 y_2(x)$，令非齐次特解为

$$
y^* = u_1(x)\,y_1(x) + u_2(x)\,y_2(x)
$$

解方程组：

$$
\begin{cases}
u_1' y_1 + u_2' y_2 = 0 \\[6pt]
u_1' y_1' + u_2' y_2' = f(x)
\end{cases}
$$

由 Cramer 法则：

$$
u_1' = \frac{-y_2\,f(x)}{W(x)}, \qquad u_2' = \frac{y_1\,f(x)}{W(x)}
$$

其中 $W(x) = y_1 y_2' - y_2 y_1'$ 是 Wronski 行列式。

---

### 2.6 例题

#### 例 6：常系数齐次

求解 $y'' - 5y' + 6y = 0$

**解**：特征方程 $\lambda^2 - 5\lambda + 6 = 0 \Rightarrow \lambda_1 = 2,\;\lambda_2 = 3$

$$
y = C_1 e^{2x} + C_2 e^{3x}
$$

---

#### 例 7：常系数齐次（复根）

求解 $y'' + 4y = 0$

**解**：特征方程 $\lambda^2 + 4 = 0 \Rightarrow \lambda = \pm 2i$（$\alpha=0,\;\beta=2$）

$$
y = C_1\cos 2x + C_2\sin 2x
$$

---

#### 例 8：常系数非齐次

求解 $y'' - 3y' + 2y = xe^x$

**解**：

**第一步**：齐次部分 $\lambda^2 - 3\lambda + 2 = 0 \Rightarrow \lambda_1=1,\;\lambda_2=2$

$$
Y = C_1 e^x + C_2 e^{2x}
$$

**第二步**：$f(x) = x\,e^x$，$\alpha = 1$ 是单特征根，$k=1$，$m=1$

设 $y^* = x(ax+b)e^x = (ax^2+bx)e^x$

代入计算：$y^{*\prime} = (ax^2+bx+2ax+b)e^x$，$y^{*\prime\prime} = (ax^2+bx+4ax+2a+2b)e^x$

代入原方程比较系数得 $a = -\dfrac{1}{2}$，$b = -1$

$$
y^* = -\left(\frac{x^2}{2} + x\right)e^x
$$

**最终**：$y = C_1 e^x + C_2 e^{2x} - \left(\dfrac{x^2}{2} + x\right)e^x$

---

#### 例 9：可降阶方程

求解 $y'' = y' + x$

**解**：令 $p = y'$，则 $p' = p + x$

$$
p' - p = x
$$

积分因子 $\mu = e^{-x}$：$(pe^{-x})' = xe^{-x}$

$$
pe^{-x} = \int xe^{-x}\,dx = -xe^{-x} - e^{-x} + C_1
$$

$$
p = -x - 1 + C_1 e^x
$$

再积分：$y = -\dfrac{x^2}{2} - x + C_1 e^x + C_2$

---

## 三、线性微分方程组

### 3.1 常系数齐次方程组

$$
\frac{d\mathbf{x}}{dt} = A\mathbf{x}
$$

**方法**：

1. 解特征方程 $|A - \lambda E| = 0$，求得特征值 $\lambda_1,\,\lambda_2,\,\dots$
2. 对每个 $\lambda_k$，解 $(A - \lambda_k E)\boldsymbol{\nu}_k = \mathbf{0}$ 得特征向量 $\boldsymbol{\nu}_k$
3. 通解为

$$
\mathbf{x}(t) = \sum_{k} C_k\,\boldsymbol{\nu}_k\,e^{\lambda_k t}
$$

!!! note "复特征根的处理"
    若 $\lambda_1 = \alpha + \beta i$，对应特征向量 $\boldsymbol{\nu}_1 = \mathbf{p} + \mathbf{q}i$，则实值解为：

    $$
    \mathbf{x}_1' = e^{\alpha t}(\mathbf{p}\cos\beta t - \mathbf{q}\sin\beta t)
    $$

    $$
    \mathbf{x}_2' = e^{\alpha t}(\mathbf{p}\sin\beta t + \mathbf{q}\cos\beta t)
    $$

---

### 3.2 非齐次方程组

$$
\frac{d\mathbf{x}}{dt} = A\mathbf{x} + \mathbf{f}(t)
$$

**消元法**：通过代入法或加减法消去多余变量，化为单个高阶方程。

**矩阵指数法**：

通解为

$$
\mathbf{x}(t) = e^{At}\,\mathbf{x}_0 + \int_0^t e^{A(t-s)}\,\mathbf{f}(s)\,ds
$$

其中矩阵指数 $e^{At} = \sum_{k=0}^{\infty}\dfrac{(At)^k}{k!}$。

**矩阵指数的性质**：

- $e^{A \cdot 0} = E$
- $\dfrac{d}{dt}e^{At} = A\,e^{At} = e^{At}\,A$
- 若 $AB = BA$，则 $e^{(A+B)t} = e^{At}\,e^{Bt}$

---

### 3.3 例题

#### 例 10：齐次方程组

求解 $\mathbf{x}' = \begin{pmatrix} 1 & 2 \\ 4 & 3 \end{pmatrix}\mathbf{x}$

**解**：特征方程

$$
\begin{vmatrix} 1-\lambda & 2 \\ 4 & 3-\lambda \end{vmatrix} = (1-\lambda)(3-\lambda) - 8 = \lambda^2 - 4\lambda - 5 = 0
$$

$\lambda_1 = 5,\;\lambda_2 = -1$

$\lambda_1 = 5$：$(A-5E)\boldsymbol{\nu} = 0 \Rightarrow \boldsymbol{\nu}_1 = \begin{pmatrix} 1 \\ 2 \end{pmatrix}$

$\lambda_2 = -1$：$(A+E)\boldsymbol{\nu} = 0 \Rightarrow \boldsymbol{\nu}_2 = \begin{pmatrix} 1 \\ -1 \end{pmatrix}$

$$
\mathbf{x}(t) = C_1\begin{pmatrix} 1 \\ 2 \end{pmatrix}e^{5t} + C_2\begin{pmatrix} 1 \\ -1 \end{pmatrix}e^{-t}
$$

---

#### 例 11：消元法

求解

$$
\begin{cases}
\dfrac{dx}{dt} = x + y \\[8pt]
\dfrac{dy}{dt} = 4x - 2y
\end{cases}
$$

**解**：由第一式 $y = x' - x$，$y' = x'' - x'$

代入第二式：$x'' - x' = 4x - 2(x' - x)$

$$
x'' + x' - 6x = 0
$$

特征方程 $\lambda^2 + \lambda - 6 = 0 \Rightarrow \lambda_1 = 2,\;\lambda_2 = -3$

$$
x(t) = C_1 e^{2t} + C_2 e^{-3t}
$$

回代 $y = x' - x = (2C_1 - C_1)e^{2t} + (-3C_2 - C_2)e^{-3t}$

$$
y(t) = C_1 e^{2t} - 4C_2 e^{-3t}
$$

---

## 四、存在唯一性定理

### 4.1 Picard 定理

对于初值问题 $y' = f(x,y)$，$y(x_0) = y_0$：

若 $f(x,y)$ 在矩形区域 $R: |x-x_0| \le a,\;|y-y_0| \le b$ 上满足：

1. $f(x,y)$ 连续
2. $f(x,y)$ 关于 $y$ 满足 **Lipschitz 条件**：$|f(x,y_1) - f(x,y_2)| \le L|y_1 - y_2|$

则初值问题在 $|x - x_0| \le h$（$h = \min\left\{a,\;\dfrac{b}{M}\right\}$，$M = \max_R |f|$）上存在唯一解。

### 4.2 逐次逼近法（Picard 迭代）

$$
\varphi_0(x) = y_0
$$

$$
\varphi_n(x) = y_0 + \int_{x_0}^{x} f(t,\,\varphi_{n-1}(t))\,dt
$$

序列 $\{\varphi_n(x)\}$ 一致收敛于真实解 $\varphi(x)$。

### 4.3 解的延拓

- **局部存在定理**：解在 $|x-x_0| \le h$ 上存在，并可逐步延拓至最大存在区间
- **向右延拓定理**：$x$ 增加时，解可延拓至边界
- **连续依赖性**：解关于初值连续依赖
- **可微性**：$\dfrac{\partial y}{\partial y_0} = \exp\!\left(\displaystyle\int_{x_0}^{x}\dfrac{\partial f}{\partial y}\,ds\right)$

---

## 五、矩阵指数计算专题


### 定义

$$
e^{At} = \sum_{k=0}^{\infty}\frac{(At)^k}{k!} = E + At + \frac{(At)^2}{2!} + \frac{(At)^3}{3!} + \cdots
$$

### 关键性质

$$
e^{A \cdot 0} = E, \qquad \frac{d}{dt}e^{At} = A\,e^{At} = e^{At}\,A
$$

$$
e^{(A+B)t} = e^{At}\,e^{Bt} \quad \text{（仅当 } AB = BA \text{）}
$$

### 计算示例

$$
A = \begin{pmatrix} 3 & 5 \\ -5 & 3 \end{pmatrix} = 3E + 5B, \qquad B = \begin{pmatrix} 0 & 1 \\ -1 & 0 \end{pmatrix}
$$

因为 $3E \cdot 5B = 5B \cdot 3E$（可交换），所以

$$
e^{At} = e^{3Et}\,e^{5Bt} = e^{3t}\,e^{5Bt}
$$

注意 $B^2 = -E$，故

$$
e^{5Bt} = \cos(5t)\,E + \sin(5t)\,B = \begin{pmatrix} \cos 5t & \sin 5t \\ -\sin 5t & \cos 5t \end{pmatrix}
$$

$$
e^{At} = e^{3t}\begin{pmatrix} \cos 5t & \sin 5t \\ -\sin 5t & \cos 5t \end{pmatrix}
$$

### 方程组求解

$$
\frac{d\mathbf{X}}{dt} = A\mathbf{X} \quad \Longrightarrow \quad \mathbf{X}(t) = e^{At}\,\mathbf{c}
$$

其中 $\mathbf{c}$ 是由初始条件确定的常数列向量。

---

## 六、一阶线性微分方程的两种求法对比


标准形式：$y' + P(x)\,y = Q(x)$

| | 积分因子法 | 常数变易法 |
|:--|:----------|:----------|
| **核心思想** | 乘以 $\mu(x) = e^{\int P\,dx}$，左端凑导数 | 将齐次解中的常数 $C$ 变易为 $C(x)$ |
| **关键步骤** | $[y\,\mu]' = Q\,\mu$，直接积分 | $C'(x) = Q(x)\,e^{\int P\,dx}$，积分回代 |
| **最终公式** | $y = e^{-\int P\,dx}\!\left[\int Q\,e^{\int P\,dx}\,dx + C\right]$ | 同左（殊途同归） |
| **优势** | 计算直接，步骤少 | 思路清晰，易推广到高阶 |

---

## 附录：方法速查表

| 方程类型 | 标准形式 | 方法 |
|:--------|:---------|:-----|
| 可分离变量 | $y' = f(x)g(y)$ | 分离变量，两端积分 |
| 齐次方程 | $y' = \varphi(y/x)$ | 令 $u = y/x$ |
| 一阶线性 | $y' + p(x)y = f(x)$ | 积分因子 / 常数变易 |
| 伯努利 | $y' + py = fy^n$ | 令 $z = y^{1-n}$ 化线性 |
| 全微分 | $M\,dx + N\,dy = 0$ | 验证 $M_y = N_x$，三种求法 |
| 可降阶（缺 $y$） | $y'' = f(x, y')$ | 令 $p = y'$ |
| 可降阶（缺 $x$） | $y'' = f(y, y')$ | 令 $p = y'(y)$，$y'' = p\,dp/dy$ |
| 常系数齐次 | $y'' + py' + qy = 0$ | 特征方程 |
| 常系数非齐次 | $y'' + py' + qy = f(x)$ | 齐次通解 + 待定系数特解 |
| 欧拉方程 | $x^2 y'' + axy' + by = f(x)$ | 令 $x = e^t$ |
| 变系数齐次 | $y'' + p(x)y' + q(x)y = 0$ | Liouville 公式 / 降阶法 |
| 变系数非齐次 | $y'' + p(x)y' + q(x)y = f(x)$ | 变动任意常数法 |
| 常系数齐次组 | $\mathbf{x}' = A\mathbf{x}$ | 特征值 + 特征向量 |
| 非齐次组 | $\mathbf{x}' = A\mathbf{x} + \mathbf{f}(t)$ | 消元法 / 矩阵指数 |
