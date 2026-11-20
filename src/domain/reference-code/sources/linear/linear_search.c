/*
 * AlgoViz 教材参考 C 实现
 * 来源：用户提供的《数据结构与算法（Windows版）》第8章查找/01静态查找_Search.c
 * 节选无哨兵/有哨兵顺序查找函数与教材注释；演示 main 为阅读入口。
 * 原始版权归原教材作者/出版方所有，仅用于本地学习与代码阅读。
 */

#include "stdio.h"    
#include "stdlib.h"   

#include "math.h"  
#include "time.h"

#define OK 1
#define ERROR 0
#define TRUE 1
#define FALSE 0
#define MAXSIZE 100 /* 存储空间初始分配量 */

typedef int Status;	/* Status是函数的类型,其值是函数结果状态代码，如OK等 */ 

int F[100]; /* 斐波那契数列 */

/* 斐波那契数列 */

/* 无哨兵顺序查找，a为数组，n为要查找的数组个数，key为要查找的关键字 */
int Sequential_Search(int *a,int n,int key)
{
	int i;
	for(i=1;i<=n;i++)
	{
		if (a[i]==key)
			return i;
	}
	return 0;
}

/* 有哨兵顺序查找 */
int Sequential_Search2(int *a,int n,int key)
{
	int i;
	a[0]=key;
	i=n;
	while(a[i]!=key)
	{
		i--;
	}
	return i;
}

int main(void)
{
    int data[6] = {0, 21, 37, 88, 19, 92};
    int index = Sequential_Search(data, 5, 88);
    printf("Sequential_Search: index=%d\n", index);
    index = Sequential_Search2(data, 5, 19);
    printf("Sequential_Search2: index=%d\n", index);
    return 0;
}
