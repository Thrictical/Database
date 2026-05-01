#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX 100  // max number of customers

// Note: This code uses types/functions common in the CS50 library.
// If not using cs50.h, 'string' is 'char*' and 'get_int'/'get_string' need implementation.
typedef char* string;

typedef struct
{
    char *name;
    int number;
    char *info;
} customer;

// Mocking CS50 functions for local "working" status if needed
int get_int(const char* prompt) {
    int n;
    printf("%s", prompt);
    scanf("%d", &n);
    getchar(); // consume newline
    return n;
}

char* get_string(const char* prompt) {
    char* buffer = malloc(256);
    printf("%s", prompt);
    fgets(buffer, 256, stdin);
    buffer[strcspn(buffer, "\n")] = 0; // remove newline
    return buffer;
}


void InputCustomer(customer customers[], int *count);
void ViewCustomer(customer customers[], int count);
void EditCustomer(customer customers[], int count);
void DeleteCustomer(customer customers[], int *count);

int main(void)
{
    customer customers[MAX];
    int count = 0;  // tracks how many customers are actually stored

    printf("\n\n-------------------------------\n");
    printf("   Welcome to the Database!\n");
    printf("-------------------------------\n\n");

    int reply;
    do
    {
        printf("1. Add\n");
        printf("2. View\n");
        printf("3. Edit\n");
        printf("4. Delete\n");
        printf("5. Exit\n");
        reply = get_int("");

        if (reply == 1)
            InputCustomer(customers, &count);
        else if (reply == 2)
            ViewCustomer(customers, count);
        else if (reply == 3)
            EditCustomer(customers, count);
        else if (reply == 4)
            DeleteCustomer(customers, &count);
        else if (reply == 5)
            printf("Goodbye!\n");
        else
            printf("Invalid input.\n\n");

    } while (reply != 5);  // keep showing menu until user exits

    return 0;
}

void InputCustomer(customer customers[], int *count)
{
    if (*count >= MAX)
    {
        printf("Database is full.\n\n");
        return;
    }
    int amount = get_int("How many customers do you want to add? ");
    if (amount <= 0)
    {
        printf("Invalid amount.\n\n");
        return;
    }
    if (*count + amount > MAX)
    {
        printf("Not enough space. You can only add %i more.\n\n", MAX - *count);
        return;
    }
    for (int k = 0; k < amount; k++)
    {
        printf("\nCustomer %i:\n", *count + 1);
        string name = get_string("Customer name: ");
        for (int j = 0; j < (int)strlen(name); j++)
            name[j] = tolower(name[j]);

        customers[*count].name = name;
        customers[*count].number = get_int("Customer number: ");
        customers[*count].info = get_string("Additional information: ");
        (*count)++;
        printf("Customer added!\n");
    }
    printf("\n");
}


void ViewCustomer(customer customers[], int count)
{
    if (count == 0)
    {
        printf("No customers in database.\n\n");
        return;
    }
    string who = get_string("Which customer? ");
    for (int i = 0; i < (int)strlen(who); i++)
        who[i] = tolower(who[i]);

    for (int i = 0; i < count; i++)
    {
        if (strcmp(who, customers[i].name) == 0)
        {
            printf("\n------Found------\n\n");
            printf("Name: %s\n", customers[i].name);
            printf("Mobile Number: %i\n", customers[i].number);
            printf("Additional Information: %s\n", customers[i].info);
            return;
        }
    }
    printf("Customer not found.\n\n");
}

void EditCustomer(customer customers[], int count)
{
    if (count == 0)
    {
        printf("No customers in database.\n\n");
        return;
    }
    // Show all customers
    printf("\nCustomers:\n");
    for (int i = 0; i < count; i++)
        printf("%i. %s\n", i + 1, customers[i].name);

    string who = get_string("Which customer do you want to edit? ");
    for (int i = 0; i < (int)strlen(who); i++)
        who[i] = tolower(who[i]);

    for (int i = 0; i < count; i++)
    {
        if (strcmp(who, customers[i].name) == 0)
        {
            customers[i].name = get_string("New name: ");
            customers[i].number = get_int("New number: ");
            customers[i].info = get_string("New info: ");
            printf("Customer updated!\n\n");
            return;
        }
    }
    printf("Customer not found.\n\n");
}

void DeleteCustomer(customer customers[], int *count)
{
    if (*count == 0)
    {
        printf("No customers in database.\n\n");
        return;
    }
    // Show all customers
    printf("\nCustomers:\n");
    for (int i = 0; i < *count; i++)
        printf("%i. %s\n", i + 1, customers[i].name);

    string who = get_string("Which customer do you want to delete? ");
    for (int i = 0; i < (int)strlen(who); i++)
        who[i] = tolower(who[i]);

    for (int i = 0; i < *count; i++)
    {
        if (strcmp(who, customers[i].name) == 0)
        {
            // Shift all entries after this one left by one
            for (int j = i; j < *count - 1; j++)
                customers[j] = customers[j + 1];
            (*count)--;
            printf("Customer deleted!\n\n");
            return;
        }
    }
    printf("Customer not found.\n\n");
}
