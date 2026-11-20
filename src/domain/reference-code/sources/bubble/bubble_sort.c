/*
 * AlgoViz 教材参考 C 实现
 * 来源：用户提供的《数据结构与算法（Windows版）》第9章排序/01排序_Sort.c
 * 节选顺序表定义、swap/print 与本算法函数，教材注释逐字保留；演示 main 为阅读入口。
 * 原始版权归原教材作者/出版方所有，仅用于本地学习与代码阅读。
 */

#include <stdio.h>    
#include <string.h>
#include <ctype.h>      
#include <stdlib.h>   
#include <io.h>  
#include <math.h>  
#include <time.h>

#define OK 1
#define ERROR 0
#define TRUE 1
#define FALSE 0

#define MAX_LENGTH_INSERT_SORT 7 /* 用于快速排序时判断是否选用插入排序阙值 */

typedef int Status; 


#define MAXSIZE 10000  /* 用于要排序数组个数最大值，可根据需要修改 */
typedef struct
{
	int r[MAXSIZE+1];	/* 用于存储要排序数组，r[0]用作哨兵或临时变量 */
	int length;			/* 用于记录顺序表的长度 */
}SqList;

/* 交换L中数组r的下标为i和j的值 */
void swap(SqList *L,int i,int j) 
{ 
	int temp=L->r[i]; 
	L->r[i]=L->r[j]; 
	L->r[j]=temp; 
}

void print(SqList L)
{
	int i;
	for(i=1;i<L.length;i++)
		printf("%d,",L.r[i]);
	printf("%d",L.r[i]);
	printf("\n");
}

/* 对顺序表L作冒泡排序 */
void BubbleSort(SqList *L)
{ 
	int i,j;
	for(i=1;i<L->length;i++)
	{
		for(j=L->length-1;j>=i;j--)  /* 注意j是从后往前循环 */
		{
			if(L->r[j]>L->r[j+1]) /* 若前者大于后者（注意这里与上一算法的差异）*/
			{
				 swap(L,j,j+1);/* 交换L->r[j]与L->r[j+1]的值 */
			}
		}
	}
}



int main(void)
{
    int data[9] = {50, 10, 90, 30, 70, 40, 80, 60, 20};
    int i;
    SqList list;
    list.length = 9;
    for (i = 0; i < list.length; i++)
        list.r[i + 1] = data[i];

    printf("冒泡排序前: ");
    print(list);
    BubbleSort(&list);
    printf("冒泡排序后: ");
    print(list);
    return 0;
}
